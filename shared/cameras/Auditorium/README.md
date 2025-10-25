# Multi-view Object Tracking Datasets #

For all datasets, videos in each sequence are synchronized. The groundtruth trajectories are fully annotated for all the videos in all the sequences using [Vatic](http://web.mit.edu/vondrick/vatic/). 

### Setup ###

Video sequences and groundtruth annotations for each camera view are available for download.

Each row in the annotation is organized as follows:

	track_id xmin ymin xmax ymax frame_number lost occluded generated label

	1   track_id. All rows with the same ID belong to the same path.
	2   xmin. The top left x-coordinate of the bounding box.
	3   ymin. The top left y-coordinate of the bounding box.
	4   xmax. The bottom right x-coordinate of the bounding box.
	5   ymax. The bottom right y-coordinate of the bounding box.
	6   frame_number. The frame that this annotation represents.
	7   lost. If 1, the annotation is outside of the view screen.
	8   occluded. If 1, the annotation is occluded.
	9   generated. If 1, the annotation was automatically interpolated.
	10  label. human, car/vehicle, bicycle.

We assign an unique ID for each object, whether it appears once or several times in the scene. Since the ultimate task of multi-view multi-object tracking is to discover the complete 3D trajectory of any targeted individual under a camera network, we believe uniquely assigned ID should be the groundtruth to fully evaluate the trackers, which poses higher requirements than conventional tracking tasks.

### Auditorium Dataset ###

This dataset is collected and annotated by Yuanlu Xu, Hang Qi, Yang Liu, Yansong Tang and Nawin Waree. We are from Center for Vision, Cognition, Learning, and Autonomy (VCLA), University of California, Los Angeles (UCLA). 

![alt text](http://web.cs.ucla.edu/~yuanluxu/research/multiview_track/campus_dataset.bmp)

This dataset is designed for multi-view object tracking algorithms to test on dense foreground, complex scenarios, various object scales.  

* dense foreground: around 15-25 objects, frequent conjunctions and occlusions.
* complex scenarios: objects conducting diverse activities, dynamic background, interactions between objects and background.
* various object scales: tracking targets sometimes either too tiny or huge to be accommodated in certain cameras.

The sequence is shot by 3-4 high-quality DV cameras mounted around 1.5m-2m above ground and each camera covers both overlapping regions and non-overlapping regions with other cameras. 

The videos are recorded with frame rate 30fps and duration about 3-4 minutes.  The resolution is preserved in 1920X1080, for better precision and richer information.

#### How to use the calibration matrix ####

	% (y, x) is a 2D image coordinate in view_i. First rescale it
	x = x * view_i.scale;
	y = y * view_i.scale;
	view_i.A = view_i.K * view_i.R;
	view_i.A = [view_i.A(:, 1:2) [view_i.center(1) - x; view_i.center(2) - y; -1]];
	view_i.KRT = view_i.K * view_i.R * view_i.T;
	p = view_i.A \ view_i.KRT;
	% p is the corresponding ground plane 3D coordinates in the world frame
	p = [p(1); p(2); 0];

### Reference ###

Please site our paper if you use this dataset.

"Cross-view People Tracking by Scene-centered Spatio-temporal Parsing", Yuanlu Xu, Xiaobai Liu, Lei Qin, Song-Chun Zhu, AAAI Conference on Artificial Intelligence (AAAI), 2017.

"Multi-view People Tracking via Hierarchical Trajectory Composition", Yuanlu Xu, Xiaobai Liu, Yang Liu, Song-Chun Zhu, IEEE Conference on Computer Vision and Pattern Recognition (CVPR), 2016.

### License ###

CAMPUS dataset is with MIT license. For EPFL and PETS 2009 datasets, please refer to their original licenses. 

### Contact ###

Please contact Yuanlu Xu (yuanluxu@cs.ucla.edu) if you have any questions.