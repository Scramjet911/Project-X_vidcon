import React from 'react';
import { connect } from 'react-redux';
import { raisedHandsSelector } from '../Selectors';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import * as toolareaActions from '../../actions/toolareaActions';
import ShowChartRoundedIcon from '@material-ui/icons/ShowChartRounded';
import PeopleAltRoundedIcon from '@material-ui/icons/PeopleAltRounded';
import ChatIcon from '@material-ui/icons/Chat';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useIntl } from 'react-intl';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Badge from '@material-ui/core/Badge';
import Chat from './Chat/Chat';
import FileSharing from './FileSharing/FileSharing';
import AttentionStats from './AttentionStats/AttentionStats';
import ParticipantList from './ParticipantList/ParticipantList';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Logger from '../../Logger';

const logger = new Logger('Meeting Drawer');

const tabs =
[
	'chat',
	'files',
	'users',
	'attention'
];

const styles = (theme) =>
	({
		root :
		{
			display         : 'flex',
			flexDirection   : 'column',
			width           : '100%',
			height          : '100%',
			backgroundColor : theme.palette.background.paper
		},
		appBar :
		{
			display       : 'flex',
			flexDirection : 'row'
		},
		tabsHeader :
		{
			flexGrow : 1
		},
		tab :
		{
			width    : '25% !important',
			minWidth : '25% !important'
			// maxWidth : '48% !important'
		}
	});

const MeetingDrawer = (props) =>
{
	const intl = useIntl();

	const {
		currentToolTab,
		unreadMessages,
		unreadFiles,
		raisedHands,
		closeDrawer,
		setToolTab,
		classes,
		theme
	} = props;

	const [ attention, setAttention ] = React.useState(0);

	const handleFetchAttention = async () =>
	{
		logger.debug('Fetching Attention');
		const authdata = JSON.parse(window.name);
		const attentionPromise = await fetch(`https://localhost:8883/api/v1/conference/attention/${authdata.classId}`,
			{
				method  : 'GET',
				headers : {
					'Authorization' : `Bearer ${authdata.token}`,
					'Accept'        : 'application/json'
				}
			});

		attentionPromise.json()
			.then((data) =>
			{
				logger.debug(data);

				if (data !== attention)
				{
					setAttention(data.attention);
				}
			})
			.catch((err) =>
			{
				logger.debug(`Error : ${err}`);
			});
	};

	return (
		<div className={classes.root}>
			<AppBar
				position='static'
				color='default'
				className={classes.appBar}
			>
				<Tabs
					className={classes.tabsHeader}
					value={tabs.indexOf(currentToolTab)}
					onChange={(event, value) => setToolTab(tabs[value])}
					indicatorColor='primary'
					textColor='primary'
					variant='standard'
				>
					<Tab
						label={
							<Badge color='secondary' badgeContent={unreadMessages}>
								<Tooltip
									title={intl.formatMessage({
										id             : 'label.chat',
										defaultMessage : 'Chat'
									})}
								>
									<IconButton
										aria-label={intl.formatMessage({
											id             : 'tooltip.chat',
											defaultMessage : 'Show chat'
										})}
										className={classes.actionButton}
										color='inherit'
									>
										<ChatIcon />
									</IconButton>
								</Tooltip>
								{/* {intl.formatMessage({
									id             : 'label.chat',
									defaultMessage : 'Chat'
								})} */}
							</Badge>
						}
						className={classes.tab}
					/>
					<Tab
						label={
							<Badge color='secondary' badgeContent={unreadFiles}>
								<Tooltip
									title={intl.formatMessage({
										id             : 'label.filesharing',
										defaultMessage : 'File sharing'
									})}
								>
									<IconButton
										aria-label={intl.formatMessage({
											id             : 'tooltip.filesharing',
											defaultMessage : 'Share Files'
										})}
										className={classes.actionButton}
										color='inherit'
									>
										<FileCopyIcon />
									</IconButton>
								</Tooltip>
								{/* {intl.formatMessage({
									id             : 'label.filesharing',
									defaultMessage : 'File sharing'
								})} */}
							</Badge>
						}
						className={classes.tab}
					/>
					<Tab
						label={
							<Badge color='secondary' badgeContent={raisedHands}>
								<Tooltip
									title={intl.formatMessage({
										id             : 'label.participants',
										defaultMessage : 'Participants'
									})}
								>
									<IconButton
										aria-label={intl.formatMessage({
											id             : 'tooltip.participants',
											defaultMessage : 'Show participants'
										})}
										className={classes.actionButton}
										color='inherit'
									>
										<PeopleAltRoundedIcon />
									</IconButton>
								</Tooltip>
								{/* {intl.formatMessage({
									id             : 'label.participants',
									defaultMessage : 'Participants'
								})} */}
							</Badge>
						}
						className={classes.tab}
					/>
					<Tab
						label={
							<Badge color='secondary' variant='dot'>
								<Tooltip
									title={intl.formatMessage({
										id             : 'label.attention',
										defaultMessage : 'Attention Statistics'
									})}
								>
									<IconButton
										aria-label={intl.formatMessage({
											id             : 'tooltip.openAttention',
											defaultMessage : 'Open attention statistics'
										})}
										className={classes.actionButton}
										color='inherit'
									>
										<ShowChartRoundedIcon />
									</IconButton>
								</Tooltip>
								{/* {intl.formatMessage({
									id             : 'label.attention',
									defaultMessage : 'Attention'
								})} */}
							</Badge>
						}
						className={classes.tab}
						onClick={() => handleFetchAttention()}
					/>
				</Tabs>
				<IconButton onClick={closeDrawer}>
					{theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
				</IconButton>
			</AppBar>
			{currentToolTab === 'chat' && <Chat />}
			{currentToolTab === 'files' && <FileSharing />}
			{currentToolTab === 'users' && <ParticipantList />}
			{currentToolTab === 'attention' && <AttentionStats attentionState={attention} />}
		</div>
	);
};

MeetingDrawer.propTypes =
{
	currentToolTab : PropTypes.string.isRequired,
	setToolTab     : PropTypes.func.isRequired,
	unreadMessages : PropTypes.number.isRequired,
	unreadFiles    : PropTypes.number.isRequired,
	raisedHands    : PropTypes.number.isRequired,
	closeDrawer    : PropTypes.func.isRequired,
	classes        : PropTypes.object.isRequired,
	theme          : PropTypes.object.isRequired
};

const mapStateToProps = (state) =>
{
	return {
		currentToolTab : state.toolarea.currentToolTab,
		unreadMessages : state.toolarea.unreadMessages,
		unreadFiles    : state.toolarea.unreadFiles,
		raisedHands    : raisedHandsSelector(state)
	};
};

const mapDispatchToProps = {
	setToolTab : toolareaActions.setToolTab
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				prev.toolarea.currentToolTab === next.toolarea.currentToolTab &&
				prev.toolarea.unreadMessages === next.toolarea.unreadMessages &&
				prev.toolarea.unreadFiles === next.toolarea.unreadFiles &&
				prev.peers === next.peers
			);
		}
	}
)(withStyles(styles, { withTheme: true })(MeetingDrawer));
