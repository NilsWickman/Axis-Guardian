#!/usr/bin/env python3
"""
Inject Mock Embeddings into Existing Detection Files

Creates synthetic embeddings based on track_id to test the dual tracking system.
Each track_id gets a unique embedding that remains consistent across frames,
allowing the re-ID algorithm to work differently from spatial-only tracking.

Usage:
    python inject_mock_embeddings.py --input detections.json --output detections_with_embeddings.json
"""

import argparse
import json
import gzip
import random
import numpy as np
from pathlib import Path
from typing import Optional


def generate_track_embedding(track_id: int, dim: int = 512) -> list[float]:
    """Generate a deterministic embedding for a track_id.

    Uses track_id as seed to ensure same track always gets same embedding.
    This simulates what a real re-ID model would produce.
    """
    rng = np.random.RandomState(seed=track_id * 1000)
    embedding = rng.randn(dim).astype(np.float32)
    # L2 normalize
    embedding = embedding / np.linalg.norm(embedding)
    return embedding.tolist()


def generate_clothing_colors(track_id: int) -> dict:
    """Generate deterministic clothing colors based on track_id."""
    colors = ['black', 'white', 'gray', 'red', 'blue', 'green', 'yellow',
              'orange', 'purple', 'pink', 'brown', 'beige', 'navy', 'cyan']

    rng = random.Random(track_id * 500)

    # Pick 2-3 colors for upper and lower
    upper_colors = rng.sample(colors, k=2)
    lower_colors = rng.sample(colors, k=2)

    return {
        'upper_clothing': {
            'colors': [
                {'name': upper_colors[0], 'score': 0.6},
                {'name': upper_colors[1], 'score': 0.4},
            ]
        },
        'lower_clothing': {
            'colors': [
                {'name': lower_colors[0], 'score': 0.7},
                {'name': lower_colors[1], 'score': 0.3},
            ]
        }
    }


def add_noise_to_embedding(embedding: list[float], noise_level: float = 0.05) -> list[float]:
    """Add small random noise to simulate frame-to-frame variation."""
    arr = np.array(embedding)
    noise = np.random.randn(len(embedding)) * noise_level
    noisy = arr + noise
    # Re-normalize
    noisy = noisy / np.linalg.norm(noisy)
    return noisy.tolist()


def inject_embeddings(
    input_path: str,
    output_path: str,
    noise_level: float = 0.05,
    embedding_dim: int = 512,
) -> dict:
    """Inject mock embeddings into detection file.

    Args:
        input_path: Path to input detection JSON file
        output_path: Path to output file
        noise_level: Amount of noise to add per frame (0-1)
        embedding_dim: Embedding dimension (default 512 for OSNet)

    Returns:
        Statistics about the injection
    """
    # Load input
    path = Path(input_path)
    if path.suffix == '.gz':
        with gzip.open(path, 'rt', encoding='utf-8') as f:
            data = json.load(f)
    else:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

    # Track statistics
    stats = {
        'total_detections': 0,
        'detections_with_track_id': 0,
        'embeddings_added': 0,
        'unique_tracks': set(),
    }

    # Cache of base embeddings per track_id
    track_embeddings: dict[int, list[float]] = {}
    track_colors: dict[int, dict] = {}

    # Process each frame
    for frame in data.get('frames', []):
        for detection in frame.get('detections', []):
            stats['total_detections'] += 1

            track_id = detection.get('track_id')
            if track_id is None:
                continue

            stats['detections_with_track_id'] += 1
            stats['unique_tracks'].add(track_id)

            # Get or generate base embedding for this track
            if track_id not in track_embeddings:
                track_embeddings[track_id] = generate_track_embedding(track_id, embedding_dim)
                track_colors[track_id] = generate_clothing_colors(track_id)

            # Add noisy version of the embedding
            base_emb = track_embeddings[track_id]
            noisy_emb = add_noise_to_embedding(base_emb, noise_level)

            # Create or update attributes
            if 'attributes' not in detection:
                detection['attributes'] = {}

            detection['attributes']['embedding'] = noisy_emb
            detection['attributes']['embedding_quality'] = round(0.7 + random.random() * 0.25, 3)

            # Add clothing colors
            colors = track_colors[track_id]
            detection['attributes']['upper_clothing'] = colors['upper_clothing']
            detection['attributes']['lower_clothing'] = colors['lower_clothing']

            stats['embeddings_added'] += 1

    # Update detection config
    if 'detection_config' not in data:
        data['detection_config'] = {}
    data['detection_config']['reid_enabled'] = True
    data['detection_config']['color_analysis_enabled'] = True
    data['detection_config']['mock_embeddings'] = True
    data['detection_config']['embedding_dim'] = embedding_dim

    # Save output
    out_path = Path(output_path)
    if out_path.suffix == '.gz':
        with gzip.open(out_path, 'wt', encoding='utf-8') as f:
            json.dump(data, f)
    else:
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

    stats['unique_tracks'] = len(stats['unique_tracks'])

    # Print summary
    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"\nInjection complete!")
    print(f"  Total detections: {stats['total_detections']}")
    print(f"  Detections with track_id: {stats['detections_with_track_id']}")
    print(f"  Embeddings added: {stats['embeddings_added']}")
    print(f"  Unique tracks: {stats['unique_tracks']}")
    print(f"  Output file: {output_path} ({size_mb:.2f} MB)")

    return stats


def main():
    parser = argparse.ArgumentParser(
        description='Inject mock re-ID embeddings into detection files for testing',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Inject embeddings into a detection file
    python inject_mock_embeddings.py -i view-HC3-preprocessed.detections.json -o view-HC3-reid.detections.json

    # Process multiple files
    for f in *.detections.json; do
        python inject_mock_embeddings.py -i "$f" -o "${f%.json}-reid.json"
    done
        """
    )

    parser.add_argument('--input', '-i', required=True, help='Input detection JSON file')
    parser.add_argument('--output', '-o', required=True, help='Output file with embeddings')
    parser.add_argument('--noise', type=float, default=0.05, help='Noise level per frame (default: 0.05)')
    parser.add_argument('--dim', type=int, default=512, help='Embedding dimension (default: 512)')

    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"Error: Input file not found: {args.input}")
        return 1

    inject_embeddings(
        input_path=args.input,
        output_path=args.output,
        noise_level=args.noise,
        embedding_dim=args.dim,
    )

    return 0


if __name__ == '__main__':
    exit(main())
