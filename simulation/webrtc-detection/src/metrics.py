"""Performance metrics collection for WebRTC detection service."""

import time
from typing import Dict, Optional
from collections import defaultdict
from loguru import logger


class MetricsCollector:
    """
    Lightweight metrics collector for monitoring camera simulation performance.

    Designed to be compatible with Prometheus exporters but works standalone.
    Metrics are stored in memory and can be exported via HTTP endpoint or logged.
    """

    def __init__(self):
        """Initialize metrics collector."""
        # Counter metrics (monotonically increasing)
        self.counters: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

        # Gauge metrics (can increase or decrease)
        self.gauges: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

        # Histogram metrics (distribution of values)
        self.histograms: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))

        # Metadata
        self.start_time = time.time()

        logger.info("Metrics collector initialized")

    # Counter operations
    def increment_counter(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None):
        """
        Increment a counter metric.

        Args:
            name: Metric name
            value: Amount to increment (default 1.0)
            labels: Optional labels for multi-dimensional metrics
        """
        label_key = self._serialize_labels(labels)
        self.counters[name][label_key] += value

    # Gauge operations
    def set_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """
        Set a gauge metric to a specific value.

        Args:
            name: Metric name
            value: Value to set
            labels: Optional labels
        """
        label_key = self._serialize_labels(labels)
        self.gauges[name][label_key] = value

    def increment_gauge(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None):
        """Increment a gauge metric."""
        label_key = self._serialize_labels(labels)
        self.gauges[name][label_key] = self.gauges[name].get(label_key, 0.0) + value

    def decrement_gauge(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None):
        """Decrement a gauge metric."""
        self.increment_gauge(name, -value, labels)

    # Histogram operations
    def observe_histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """
        Record an observation for a histogram metric.

        Args:
            name: Metric name
            value: Observed value
            labels: Optional labels
        """
        label_key = self._serialize_labels(labels)
        self.histograms[name][label_key].append(value)

        # Keep histogram size reasonable (last 1000 samples)
        if len(self.histograms[name][label_key]) > 1000:
            self.histograms[name][label_key] = self.histograms[name][label_key][-1000:]

    # Timing helpers
    class Timer:
        """Context manager for timing code blocks."""

        def __init__(self, collector: 'MetricsCollector', metric_name: str, labels: Optional[Dict[str, str]] = None):
            self.collector = collector
            self.metric_name = metric_name
            self.labels = labels
            self.start_time = None

        def __enter__(self):
            self.start_time = time.time()
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            duration = time.time() - self.start_time
            self.collector.observe_histogram(self.metric_name, duration, self.labels)

    def time(self, metric_name: str, labels: Optional[Dict[str, str]] = None):
        """
        Create a timer context manager.

        Usage:
            with metrics.time('detection_latency', {'camera': 'camera1'}):
                perform_detection()
        """
        return self.Timer(self, metric_name, labels)

    # Utility methods
    def _serialize_labels(self, labels: Optional[Dict[str, str]]) -> str:
        """Serialize labels to a consistent string key."""
        if not labels:
            return ""

        # Sort for consistency
        items = sorted(labels.items())
        return ",".join(f"{k}={v}" for k, v in items)

    def get_counter(self, name: str, labels: Optional[Dict[str, str]] = None) -> float:
        """Get current value of a counter."""
        label_key = self._serialize_labels(labels)
        return self.counters[name].get(label_key, 0.0)

    def get_gauge(self, name: str, labels: Optional[Dict[str, str]] = None) -> float:
        """Get current value of a gauge."""
        label_key = self._serialize_labels(labels)
        return self.gauges[name].get(label_key, 0.0)

    def get_histogram_stats(self, name: str, labels: Optional[Dict[str, str]] = None) -> Dict[str, float]:
        """
        Get statistics for a histogram.

        Returns:
            Dictionary with min, max, mean, median, p95, p99
        """
        label_key = self._serialize_labels(labels)
        values = self.histograms[name].get(label_key, [])

        if not values:
            return {
                'count': 0,
                'min': 0.0,
                'max': 0.0,
                'mean': 0.0,
                'median': 0.0,
                'p95': 0.0,
                'p99': 0.0
            }

        sorted_values = sorted(values)
        count = len(sorted_values)

        return {
            'count': count,
            'min': sorted_values[0],
            'max': sorted_values[-1],
            'mean': sum(sorted_values) / count,
            'median': sorted_values[count // 2],
            'p95': sorted_values[int(count * 0.95)],
            'p99': sorted_values[int(count * 0.99)]
        }

    def get_all_metrics(self) -> Dict:
        """
        Get all metrics in a structured format.

        Returns:
            Dictionary containing all metrics
        """
        metrics = {
            'timestamp': time.time(),
            'uptime_seconds': time.time() - self.start_time,
            'counters': {},
            'gauges': {},
            'histograms': {}
        }

        # Export counters
        for name, labels_dict in self.counters.items():
            metrics['counters'][name] = dict(labels_dict)

        # Export gauges
        for name, labels_dict in self.gauges.items():
            metrics['gauges'][name] = dict(labels_dict)

        # Export histogram stats
        for name, labels_dict in self.histograms.items():
            metrics['histograms'][name] = {}
            for label_key in labels_dict.keys():
                labels = self._deserialize_labels(label_key)
                stats = self.get_histogram_stats(name, labels)
                metrics['histograms'][name][label_key] = stats

        return metrics

    def _deserialize_labels(self, label_key: str) -> Optional[Dict[str, str]]:
        """Deserialize label string back to dict."""
        if not label_key:
            return None

        labels = {}
        for item in label_key.split(','):
            k, v = item.split('=', 1)
            labels[k] = v
        return labels

    def export_prometheus_text(self) -> str:
        """
        Export metrics in Prometheus text format.

        Returns:
            String in Prometheus exposition format
        """
        lines = []
        lines.append(f"# Metrics exported at {time.time()}")
        lines.append(f"# Uptime: {time.time() - self.start_time:.1f} seconds")
        lines.append("")

        # Export counters
        for name, labels_dict in self.counters.items():
            lines.append(f"# TYPE {name} counter")
            for label_key, value in labels_dict.items():
                label_str = f"{{{label_key}}}" if label_key else ""
                lines.append(f"{name}{label_str} {value}")

        # Export gauges
        for name, labels_dict in self.gauges.items():
            lines.append(f"# TYPE {name} gauge")
            for label_key, value in labels_dict.items():
                label_str = f"{{{label_key}}}" if label_key else ""
                lines.append(f"{name}{label_str} {value}")

        # Export histogram summaries
        for name, labels_dict in self.histograms.items():
            lines.append(f"# TYPE {name} histogram")
            for label_key in labels_dict.keys():
                labels = self._deserialize_labels(label_key)
                stats = self.get_histogram_stats(name, labels)
                label_str = f"{{{label_key}}}" if label_key else ""

                lines.append(f"{name}_count{label_str} {stats['count']}")
                lines.append(f"{name}_sum{label_str} {stats['mean'] * stats['count']}")
                lines.append(f"{name}_min{label_str} {stats['min']}")
                lines.append(f"{name}_max{label_str} {stats['max']}")
                lines.append(f"{name}_p95{label_str} {stats['p95']}")
                lines.append(f"{name}_p99{label_str} {stats['p99']}")

        return "\n".join(lines)

    def log_summary(self):
        """Log a summary of key metrics."""
        logger.info("=== Metrics Summary ===")
        logger.info(f"Uptime: {time.time() - self.start_time:.1f}s")

        # Log key counters
        if self.counters:
            logger.info("Counters:")
            for name, labels_dict in self.counters.items():
                for label_key, value in labels_dict.items():
                    logger.info(f"  {name}{{{label_key}}}: {value:.0f}")

        # Log key gauges
        if self.gauges:
            logger.info("Gauges:")
            for name, labels_dict in self.gauges.items():
                for label_key, value in labels_dict.items():
                    logger.info(f"  {name}{{{label_key}}}: {value:.2f}")

        # Log histogram stats
        if self.histograms:
            logger.info("Histograms:")
            for name, labels_dict in self.histograms.items():
                for label_key in labels_dict.keys():
                    labels = self._deserialize_labels(label_key)
                    stats = self.get_histogram_stats(name, labels)
                    logger.info(
                        f"  {name}{{{label_key}}}: "
                        f"count={stats['count']}, mean={stats['mean']:.3f}s, "
                        f"p95={stats['p95']:.3f}s, p99={stats['p99']:.3f}s"
                    )


# Global metrics instance
metrics = MetricsCollector()
