"""Setup script for SfM Site Map Generator."""

from setuptools import setup, find_packages

setup(
    name="sfm-sitemap-generator",
    version="1.0.0",
    description="Structure from Motion Site Map Generator",
    author="Axis-Guardian",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "numpy>=1.24.0",
        "opencv-python>=4.8.0",
        "opencv-contrib-python>=4.8.0",
        "scipy>=1.11.0",
        "scikit-learn>=1.3.0",
        "matplotlib>=3.7.0",
        "PyYAML>=6.0",
        "pydantic>=2.0.0",
        "click>=8.1.0",
        "tqdm>=4.66.0",
    ],
    entry_points={
        "console_scripts": [
            "sfm-sitemap=generate:main",
        ],
    },
)
