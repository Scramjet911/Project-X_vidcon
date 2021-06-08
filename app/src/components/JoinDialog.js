import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { withRoomContext } from '../RoomContext';
import classnames from 'classnames';
import * as settingsActions from '../actions/settingsActions';
import PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'react-intl';
import Dialog from '@material-ui/core/Dialog';
import DialogContentText from '@material-ui/core/DialogContentText';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Button from '@material-ui/core/Button';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import CookieConsent from 'react-cookie-consent';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import BlockIcon from '@material-ui/icons/Block';
import MicIcon from '@material-ui/icons/Mic';
import VideocamIcon from '@material-ui/icons/Videocam';
import WorkOutlineIcon from '@material-ui/icons/WorkOutline';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import randomString from 'random-string';
import { useHistory, useLocation } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';
import Logger from '../Logger';

const logger = new Logger('JoinDialog');

const styles = (theme) =>
	({
		root :
		{
			display              : 'flex',
			width                : '100%',
			height               : '100%',
			backgroundColor      : 'var(--background-color)',
			backgroundImage      : `url(${window.config ? window.config.background : null})`,
			backgroundAttachment : 'fixed',
			backgroundPosition   : 'center',
			backgroundSize       : 'cover',
			backgroundRepeat     : 'no-repeat'
		},
		dialogPaper :
		{
			width                          : '30vw',
			padding                        : theme.spacing(2),
			[theme.breakpoints.down('lg')] :
			{
				width : '40vw'
			},
			[theme.breakpoints.down('md')] :
			{
				width : '50vw'
			},
			[theme.breakpoints.down('sm')] :
			{
				width : '70vw'
			},
			[theme.breakpoints.down('xs')] :
			{
				width : '90vw'
			}
		},
		videoContainer :
		{
			position      : 'relative',
			flex          : '100 100 auto',
			height        : '100%',
			width         : '100%',
			display       : 'flex',
			flexDirection : 'column',
			overflow      : 'hidden'
		},
		video :
		{
			flex               : '100 100 auto',
			height             : '100%',
			width              : '100%',
			objectFit          : 'cover',
			userSelect         : 'none',
			transitionProperty : 'opacity',
			transitionDuration : '.15s',
			backgroundColor    : 'var(--peer-video-bg-color)',
			'&.isMirrored'     :
			{
				transform : 'scaleX(-1)'
			},
			'&.loading' :
			{
				filter : 'blur(5px)'
			},
			'&.contain' :
			{
				objectFit       : 'contain',
				backgroundColor : 'rgba(0, 0, 0, 1)'
			}
		},
		info :
		{
			width          : 'fit-content',
			height         : '100%',
			padding        : theme.spacing(1),
			position       : 'absolute',
			zIndex         : 10,
			display        : 'flex',
			flexDirection  : 'column-reverse',
			justifyContent : 'space-between'
		},
		displayName :
		{
			userSelect : 'none',
			fontSize   : 14,
			fontWeight : 600,
			color      : 'rgba(255, 255, 255, 0.85)',
			'&:hover'  :
			{
				backgroundColor : 'rgb(174, 255, 0, 0.25)'
			}
		},
		green :
		{
			color : '#5F9B2D'
		},
		red :
		{
			color : 'rgba(153, 0, 0, 1)'
		},
		joinButton :
		{
			background : '#2e7031',
			color      : 'white',
			'&:hover'  : {
				backgroundColor : '#2e7031'
			}
		},
		mediaDevicesAnySelectedButton :
		{
			'& .Mui-selected' : {
				color           : 'white',
				backgroundColor : '#5F9B2D',
				'&:hover'       : {
					color           : 'white',
					backgroundColor : '#5F9B2D'
				} }

		},

		mediaDevicesNoneSelectedButton :
		{
			'& .Mui-selected' : {
				color           : 'white',
				backgroundColor : '#f50057',
				'&:hover'       : {
					color           : 'white',
					backgroundColor : '#f50057'
				} }

		}

	});

const DialogContent = withStyles((theme) => ({
	root :
	{
		padding    : theme.spacing(2),
		paddingTop : theme.spacing(1)
	}
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
	root :
	{
		margin  : 0,
		padding : theme.spacing(1)
	}
}))(MuiDialogActions);

const JoinDialog = ({
	roomClient,
	room,
	mediaPerms,
	displayName,
	loggedIn,
	changeDisplayName,
	setMediaPerms,
	classes,
	setAudioMuted,
	setVideoMuted
}) =>
{

	const videoElement = useRef(null);

	const location = useLocation();

	const history = useHistory();

	const intl = useIntl();

	const authTypeDefault = (loggedIn) ? 'auth' : 'guest';

	const [ authType, setAuthType ] = useState(authTypeDefault);

	// eslint-disable-next-line
	const [ roomId, setRoomId ] = useState(
		decodeURIComponent(location.pathname.slice(1)) ||
		randomString({ length: 10 })
	);

	const handleSetName = () =>
	{
		try
		{
			const authData = JSON.parse(window.name);

			changeDisplayName(authData.name);
		}
		catch (error)
		{
			logger.error('Invalid Authentication Data');
		}

	};

	const streamCamVideo = (newMediaPerms) =>
	{
		const constraints = {
			audio : (newMediaPerms.audio ? newMediaPerms.audio : false),
			video : (newMediaPerms.video ? { width: 1280, height: 720 } : false)
		};

		if (newMediaPerms.audio || newMediaPerms.video)
		{
			navigator.mediaDevices
				.getUserMedia(constraints)
				.then(function(videoTrack)
				{
					videoElement.current.srcObject = videoTrack;
				})
				.catch(function(err)
				{
					logger.error(`${err.name} : ${err.message} ${JSON.stringify(mediaPerms.audio)}`);
				});
		}
		else if (videoElement.current != null && videoElement.current.srcObject)
		{
			const tracks = videoElement.current.srcObject.getTracks();

			for (let i = 0; i < tracks.length; i++)
			{
				tracks[i].stop();
			}
			videoElement.current.srcObject = null;
		}
	};

	useEffect(() =>
	{
		window.history.replaceState({}, null, encodeURIComponent(roomId) || '/');
		handleSetName();
		// eslint-disable-next-line
	}, [ roomId ]);

	useEffect(() =>
	{
		streamCamVideo(mediaPerms);
		// eslint-disable-next-line
	}, [ mediaPerms ]);

	useEffect(() =>
	{
		(location.pathname === '/') && history.push(encodeURIComponent(roomId));
	});

	const _askForPerms = () =>
	{
		if (mediaPerms.video || mediaPerms.audio)
		{
			navigator.mediaDevices.getUserMedia(mediaPerms);
		}
	};

	const handleSetMediaPerms = (event, newMediaPerms) =>
	{
		if (newMediaPerms !== null)
		{
			setMediaPerms(JSON.parse(newMediaPerms));
		}
	};

	const handleSetAuthType = (event, newAuthType) =>
	{
		if (newAuthType !== null)
		{
			setAuthType(newAuthType);
		}

	};

	const handleJoin = () =>
	{
		setAudioMuted(false);

		setVideoMuted(false);

		_askForPerms();

		const encodedRoomId = encodeURIComponent(roomId);

		roomClient.join({
			roomId    : encodedRoomId,
			joinVideo : mediaPerms.video,
			joinAudio : mediaPerms.audio
		});
	};

	const handleJoinUsingEnterKey = (event) =>
	{
		if (event.key === 'Enter') document.getElementById('joinButton').click();
	};

	return (
		<div className={classes.root}>
			<Dialog
				onKeyDown={handleJoinUsingEnterKey}
				open
				classes={{
					paper : classes.dialogPaper
				}}
			>
				<DialogContent>
					{/* CHECK ROOM VIDEO */}
					<div className={classes.videoContainer}>
						<div className={classes.info}>
							<span className={classes.displayName}>
								{displayName}
							</span>
						</div>
						<video
							ref={videoElement}
							className={classnames(classes.video, {
								hidden : mediaPerms.video
							})}
							autoPlay
							playsInline
							muted
							controls={false}
						/>
					</div>
					{/* CHECK ROOM VIDEO */}

					{/* AUTH TOGGLE BUTTONS */}
					{false &&
					<Grid container
						direction='row'
						justify='space-between'
						alignItems='center'
					>
						<Grid item>
							<ToggleButtonGroup
								value={authType}
								onChange={handleSetAuthType}
								aria-label='choose auth'
								exclusive
							>
								<ToggleButton value='guest'>
									<WorkOutlineIcon/>&nbsp;

									<FormattedMessage
										id='room.joinRoomm'
										defaultMessage='Guest'
									/>
								</ToggleButton>

								<ToggleButton value='auth'>
									<VpnKeyIcon/>&nbsp;

									<FormattedMessage
										id='room.joinRoomm'
										defaultMessage='Auth'
									/>
								</ToggleButton>

							</ToggleButtonGroup >

						</Grid>

					</Grid>
					}
					{/* /AUTH TOGGLE BUTTONS */}

					{!room.inLobby && room.overRoomLimit &&
						<DialogContentText className={classes.red} variant='h6' gutterBottom>
							<FormattedMessage
								id='room.overRoomLimit'
								defaultMessage={
									'The room is full, retry after some time.'
								}
							/>
						</DialogContentText>
					}
				</DialogContent>

				{ !room.inLobby ?

					<DialogActions>

						<Grid container
							direction='row'
							justify='space-between'
							alignItems='flex-end'
						>

							{/* MEDIA PERMISSIONS TOGGLE BUTTONS */}
							<Grid item>
								<FormControl component='fieldset'>
									<Box mb={1}>
										<FormLabel component='legend'>
											<FormattedMessage
												id='devices.chooseMedia'
												defaultMessage='Choose Media'
											/>
										</FormLabel>
									</Box>
									<ToggleButtonGroup
										value={JSON.stringify(mediaPerms)}
										size='small'
										onChange={handleSetMediaPerms}
										className={
											JSON.stringify(mediaPerms) ===
											'{"audio":false,"video":false}' ?
												classes.mediaDevicesNoneSelectedButton :
												classes.mediaDevicesAnySelectedButton
										}
										aria-label='choose permission'
										exclusive
									>
										<ToggleButton value='{"audio":false,"video":false}'>
											<Tooltip title={intl.formatMessage({
												id             : 'devices.disableBothMicrophoneAndCamera',
												defaultMessage : 'Disable both Microphone And Camera'
											})} placement='bottom'
											>
												<BlockIcon/>
											</Tooltip>
										</ToggleButton>
										<ToggleButton value='{"audio":true,"video":false}'>
											<Tooltip title={intl.formatMessage({
												id             : 'devices.enableOnlyMicrophone',
												defaultMessage : 'Enable only Microphone'
											})} placement='bottom'
											>

												<MicIcon/>
											</Tooltip>
										</ToggleButton>
										<ToggleButton value='{"audio":false,"video":true}'>
											<Tooltip title={intl.formatMessage({
												id             : 'devices.enableOnlyCamera',
												defaultMessage : 'Enable only Camera'
											})} placement='bottom'
											>
												<VideocamIcon/>
											</Tooltip>
										</ToggleButton>
										<ToggleButton value='{"audio":true,"video":true}'>
											<Tooltip title={intl.formatMessage({
												id             : 'devices.enableBothMicrophoneAndCamera',
												defaultMessage : 'Enable both Microphone and Camera'
											})} placement='bottom'
											>
												<span style={{ display: 'flex', flexDirection: 'row' }}>
													<MicIcon/>+<VideocamIcon/>
												</span>
											</Tooltip>
										</ToggleButton>
									</ToggleButtonGroup >
								</FormControl>
							</Grid>
							{/* /MEDIA PERMISSION BUTTONS */}

							{/* JOIN/AUTH BUTTON */}
							<Grid item>
								<Button
									onClick={handleJoin}
									variant='contained'
									color='primary'
									id='joinButton'
								>
									<FormattedMessage
										id='label.join'
										defaultMessage='Join'
									/>
								</Button>

							</Grid>

							{/* /JOIN BUTTON */}

						</Grid>

					</DialogActions>
					:
					<DialogContent>
						<DialogContentText
							className={classes.green}
							gutterBottom
							variant='h6'
							style={{ fontWeight: '600' }}
							align='center'
						>
							<FormattedMessage
								id='room.youAreReady'
								defaultMessage='Ok, you are ready'
							/>
						</DialogContentText>
						{ room.signInRequired ?
							<DialogContentText
								gutterBottom
								variant='h5'
								style={{ fontWeight: '600' }}
							>
								<FormattedMessage
									id='room.emptyRequireLogin'
									defaultMessage={
										`The room is empty! You can Log In to start
										the meeting or wait until the host joins`
									}
								/>
							</DialogContentText>
							:
							<DialogContentText
								gutterBottom
								variant='h5'
								style={{ fontWeight: '600' }}
							>
								<FormattedMessage
									id='room.locketWait'
									defaultMessage='The room is locked - hang on until somebody lets you in ...'
								/>
							</DialogContentText>
						}
					</DialogContent>
				}

				<CookieConsent buttonText={intl.formatMessage({
					id             : 'room.consentUnderstand',
					defaultMessage : 'I understand'
				})}
				>
					<FormattedMessage
						id='room.cookieConsent'
						defaultMessage='This website uses cookies to enhance the user experience'
					/>
				</CookieConsent>
			</Dialog>
		</div>
	);
};

JoinDialog.propTypes =
{
	roomClient        : PropTypes.any.isRequired,
	room              : PropTypes.object.isRequired,
	roomId            : PropTypes.string.isRequired,
	displayName       : PropTypes.string.isRequired,
	loginEnabled      : PropTypes.bool.isRequired,
	loggedIn          : PropTypes.bool.isRequired,
	changeDisplayName : PropTypes.func.isRequired,
	setMediaPerms  	  : PropTypes.func.isRequired,
	classes           : PropTypes.object.isRequired,
	mediaPerms        : PropTypes.object.isRequired,
	setAudioMuted     : PropTypes.bool.isRequired,
	setVideoMuted     : PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
{
	return {
		room         : state.room,
		mediaPerms   : state.settings.mediaPerms,
		displayName  : state.settings.displayName,
		loginEnabled : state.me.loginEnabled,
		loggedIn     : state.me.loggedIn,
		myPicture    : state.me.picture
	};
};

const mapDispatchToProps = (dispatch) =>
{
	return {
		changeDisplayName : (displayName) =>
		{
			dispatch(settingsActions.setDisplayName(displayName));
		},

		setMediaPerms : (mediaPerms) =>
		{
			dispatch(settingsActions.setMediaPerms(mediaPerms));
		},
		setAudioMuted : (flag) =>
		{
			dispatch(settingsActions.setAudioMuted(flag));
		},
		setVideoMuted : (flag) =>
		{
			dispatch(settingsActions.setVideoMuted(flag));
		}

	};
};

export default withRoomContext(connect(
	mapStateToProps,
	mapDispatchToProps,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				prev.room.inLobby === next.room.inLobby &&
				prev.room.signInRequired === next.room.signInRequired &&
				prev.room.overRoomLimit === next.room.overRoomLimit &&
				prev.settings.displayName === next.settings.displayName &&
				prev.settings === next.settings &&
				prev.me.loginEnabled === next.me.loginEnabled &&
				prev.me.loggedIn === next.me.loggedIn &&
				prev.me.picture === next.me.picture
			);
		}
	}
)(withStyles(styles)(JoinDialog)));
