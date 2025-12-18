#!/usr/bin/env python3
"""
Extract camera calibration data from MATLAB cam_param.mat file.

Usage:
    python extract-calibration.py <path_to_cam_param.mat>

Output:
    JSON with K, R, T matrices for each camera (HC3, HC4, IP2, IP5)
"""

import scipy.io as sio
import json
import sys
import numpy as np

def extract_camera(cam_data, name):
    """Extract calibration data for a single camera."""
    # Handle the nested MATLAB struct format
    K = cam_data['K']
    R = cam_data['R']
    T = cam_data['T']

    # Convert to Python lists, handling various MATLAB array formats
    if hasattr(K, 'tolist'):
        K_list = K.tolist()
    else:
        K_list = [[float(K[i,j]) for j in range(3)] for i in range(3)]

    if hasattr(R, 'tolist'):
        R_list = R.tolist()
    else:
        R_list = [[float(R[i,j]) for j in range(3)] for i in range(3)]

    if hasattr(T, 'flatten'):
        T_list = T.flatten().tolist()
    else:
        T_list = [float(x) for x in T]

    return {
        'name': name,
        'K': K_list,
        'R': R_list,
        'T': T_list,
        'center': [960, 540],  # Assume 1080p (1920x1080)
        'scale': 1
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract-calibration.py <path_to_cam_param.mat>", file=sys.stderr)
        sys.exit(1)

    mat_path = sys.argv[1]

    try:
        mat = sio.loadmat(mat_path)
    except Exception as e:
        print(f"Error loading MATLAB file: {e}", file=sys.stderr)
        sys.exit(1)

    # Debug: print available keys
    print(f"Available keys in mat file: {list(mat.keys())}", file=sys.stderr)

    # The structure varies by MATLAB file format
    # Try different common patterns
    calibrations = {}

    # Pattern 1: cam_param is a struct array
    if 'cam_param' in mat:
        cam_param = mat['cam_param']
        print(f"cam_param shape: {cam_param.shape}, dtype: {cam_param.dtype}", file=sys.stderr)

        # Try to access as struct array
        try:
            for i, name in enumerate(['HC3', 'HC4', 'IP2', 'IP5']):
                if i < cam_param.shape[1]:
                    cam_data = {}
                    # Access nested struct fields
                    for field in ['K', 'R', 'T']:
                        val = cam_param[0, i][field]
                        if val.size > 0:
                            # Unwrap nested arrays
                            while hasattr(val, '__getitem__') and val.ndim > 2:
                                val = val[0, 0]
                            cam_data[field] = val

                    if cam_data:
                        calibrations[f'camera{i+1}'] = extract_camera(cam_data, name)
        except Exception as e:
            print(f"Pattern 1 failed: {e}", file=sys.stderr)

    # Pattern 2: Individual camera variables
    camera_names = [
        ('view_HC3', 'camera1', 'HC3'),
        ('view_HC4', 'camera2', 'HC4'),
        ('view_IP2', 'camera3', 'IP2'),
        ('view_IP5', 'camera4', 'IP5'),
    ]

    for var_name, cam_id, display_name in camera_names:
        if var_name in mat:
            try:
                cam_data = mat[var_name]
                if hasattr(cam_data, 'dtype') and cam_data.dtype.names:
                    # Structured array
                    cam_dict = {name: cam_data[name][0, 0] for name in cam_data.dtype.names}
                    calibrations[cam_id] = extract_camera(cam_dict, display_name)
            except Exception as e:
                print(f"Failed to extract {var_name}: {e}", file=sys.stderr)

    # Pattern 3: Direct K, R, T arrays with camera suffix
    for i, name in enumerate(['HC3', 'HC4', 'IP2', 'IP5']):
        cam_id = f'camera{i+1}'
        if cam_id not in calibrations:
            k_key = f'K_{name}'
            r_key = f'R_{name}'
            t_key = f'T_{name}'

            if k_key in mat and r_key in mat and t_key in mat:
                cam_data = {
                    'K': mat[k_key],
                    'R': mat[r_key],
                    'T': mat[t_key]
                }
                calibrations[cam_id] = extract_camera(cam_data, name)

    if not calibrations:
        print("No calibration data could be extracted. File structure:", file=sys.stderr)
        for key in mat.keys():
            if not key.startswith('_'):
                val = mat[key]
                print(f"  {key}: shape={getattr(val, 'shape', 'N/A')}, dtype={getattr(val, 'dtype', type(val))}", file=sys.stderr)
        sys.exit(1)

    # Output as JSON
    print(json.dumps(calibrations, indent=2))

if __name__ == '__main__':
    main()
