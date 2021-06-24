/* global cv */
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl';
import * as posenet from '@tensorflow-models/posenet';
import Logger from '../../Logger';

const logger = new Logger('Attention-Detection');

export default class AttentionDetection
{
	constructor(stream)
	{
		this.authdata = JSON.parse(window.name);
		this.classId = this.authdata.classId;
		try
		{
			this.initialize(stream);
		}
		catch (err)
		{
			logger.debug(`Error Initializing attention detection : ${err}`);
		}
	}

	initialize = async (stream) =>
	{
		this.detectionActive = true;
		this.minPoseConfidence = 0.1;
		this.modelPoints = cv.matFromArray(4, 3, cv.CV_64FC1, [
			0.0,
			0.0,
			0.0, // Nose tip
			0.0,
			0.0,
			0.0, // HACK! solvePnP doesn't work with 3 points, so copied the
			//   first point to make the input 4 points
			// 0.0, -330.0, -65.0,  // Chin
			-225.0,
			170.0,
			-135.0, // Left eye left corner
			225.0,
			170.0,
			-135.0 // Right eye right corne
			// -150.0, -150.0, -125.0,  // Left Mouth corner
			// 150.0, -150.0, -125.0,  // Right mouth corner
		]);

		// Camera internals
		const size = {
			width  : stream.getVideoTracks()[0].getSettings().width,
			height : stream.getVideoTracks()[0].getSettings().height
		};

		this.videoHTML = document.createElement('video');
		this.videoHTML.srcObject = stream;
		this.videoHTML.height = size.height;
		this.videoHTML.width = size.width;
		this.videoHTML.play();

		const focalLength = size.width;

		const center = [ size.width / 2, size.height / 2 ];

		this.cameraMatrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
			focalLength,
			0,
			center[0],
			0,
			focalLength,
			center[1],
			0,
			0,
			1
		]);
		// console.log("Camera Matrix:", cameraMatrix.data64F);

		// Create Matrixes
		this.imagePoints = cv.Mat.zeros(4, 2, cv.CV_64FC1);
		this.distCoeffs = cv.Mat.zeros(4, 1, cv.CV_64FC1); // Assuming no lens distortion
		this.rvec = new cv.Mat({ width: 1, height: 3 }, cv.CV_64FC1);
		this.tvec = new cv.Mat({ width: 1, height: 3 }, cv.CV_64FC1);

		this.net = await posenet.load();

		window.addEventListener('beforeunload', this.stopDetection);

		logger.debug('Initializing model');

		this.detectPoseInRealTime();
	}

	stopDetection = () =>
	{
		this.detectionActive = false;
		this.net = null;
		this.modelPoints.delete();
		this.imagePoints.delete();
		this.distCoeffs.delete();
		this.rvec.delete();
		this.tvec.delete();
		this.cameraMatrix.delete();
	};

	detectPoseInRealTime = () =>
	{
		const poseDetectionFrame = async () =>
		{
			if (this.detectionActive)
			{
			// since images are being fed from a webcam, feed in the
			// original image and then just flip the keypoints' x coordinates.
			// const flipPoseHorizontal = true;
				const pose = await this.net.estimateSinglePose(this.videoHTML, {
					flipHorizontal : false
				});

				// logger.debug(pose);
				// logger.debug(this.videoHTML);
				let attention = true;

				if (pose.score < this.minPoseConfidence)
				{
					// eslint-disable-next-line
					logger.debug("No One Present");
					attention = false;
				}
				else if (pose.keypoints.find((kpt) => kpt.part === 'nose') &&
					pose.keypoints.find((kpt) => kpt.part === 'leftEye') &&
					pose.keypoints.find((kpt) => kpt.part === 'rightEye'))
				{
					// eslint-disable-next-line
					logger.debug(pose);

					const ns = pose.keypoints.filter((kpt) => kpt.part === 'nose')[0]
						.position;
					const le = pose.keypoints.filter((kpt) => kpt.part === 'leftEye')[0]
						.position;
					const re = pose.keypoints.filter((kpt) => kpt.part === 'rightEye')[0]
						.position;

					[
						ns.x,
						ns.y, // Nose tip
						ns.x,
						ns.y, // Nose tip 
						// 399, 561, // Chin
						le.x,
						le.y, // Left eye left corner
						re.x,
						re.y // Right eye right corner
						// 345, 465, // Left Mouth corner
						// 453, 469 // Right mouth corner
					].forEach((v, i) =>
					{
						this.imagePoints.data64F[i] = v;
					});

					// initialize transition and rotation matrixes to improve estimation
					this.tvec.data64F[0] = -100;
					this.tvec.data64F[1] = 100;
					this.tvec.data64F[2] = 1000;
					const distToLeftEyeX = Math.abs(le.x - ns.x);

					const distToRightEyeX = Math.abs(re.x - ns.x);

					if (distToLeftEyeX < distToRightEyeX)
					{
						// looking at left
						this.rvec.data64F[0] = -1.0;
						this.rvec.data64F[1] = -0.75;
						this.rvec.data64F[2] = -3.0;
					}
					else
					{
						// looking at right
						this.rvec.data64F[0] = 1.0;
						this.rvec.data64F[1] = -0.75;
						this.rvec.data64F[2] = -3.0;
					}

					const success = cv.solvePnP(
						this.modelPoints,
						this.imagePoints,
						this.cameraMatrix,
						this.distCoeffs,
						this.rvec,
						this.tvec,
						true
					);

					// logger.debug(success);

					if (success)
					{
						const rvecDegree = this.rvec.data64F.map((d) => (d / Math.PI) * 180);

						// console.log("Rotation Vector:", this.rvec.data64F);
						// console.log(
						//     "Rotation Vector (in degree):",
						//     rvecDegree
						// );

						logger.debug(rvecDegree);
						if (rvecDegree && rvecDegree[0] > 75)
						{
						// eslint-disable-next-line
							logger.debug("right");
							attention = false;
						}
						else if (rvecDegree && rvecDegree[0] < -75)
						{
						// eslint-disable-next-line
							logger.debug("left");
							attention = false;
						}
						else if (rvecDegree && rvecDegree[1] < -130)
						{
						// eslint-disable-next-line
							logger.debug("top");
							attention = false;
						}
						// else if (rvecDegree && rvecDegree[1] > -45)
						// {
						// // eslint-disable-next-line
						// 	logger.debug("bottom");
						// 	attention = false;
						// }
						fetch('https://localhost:8883/api/v1/conference/attention',
							{
								method  : 'POST',
								headers :
								{
									'Authorization' : `Bearer ${this.authdata.token}`,
									'Accept'        : 'application/json',
									'Content-Type'  : 'application/json'
								},
								body : JSON.stringify({
									'classId'   : this.classId,
									'attention' : attention
								})
							});
					}
				}
				setTimeout(requestAnimationFrame, 2000, poseDetectionFrame);
			}
		};

		// while (this.videoHTML.readyState<1)
		// {
		// 	logger.debug('Waiting for video to load');
		// }
		poseDetectionFrame();
	}
}