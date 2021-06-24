import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Logger from '../../../Logger';

const logger = new Logger('Attention-Stats');

const styles = (theme) =>
	({
		root :
		{
			display       : 'flex',
			flexDirection : 'column',
			alignItems    : 'center',
			width         : '100%',
			height        : '100%',
			padding       : theme.spacing(1)
		},
		title :
		{
			textAlign : 'center',
			margin    : '50px 0 50px 0'
		},
		text :
		{
			margin  : 0,
			padding : theme.spacing(1)
		},
		button :
		{
			marginRight : 'auto'
		},
		progressWrapper :
		{
			marginBottom : '30px'
		},
		progress :
		{
			width : '100px',
			color : '#1a78c2'
		}
	});

class AttentionStats extends React.PureComponent
{
	render()
	{
		const {
			classes
		} = this.props;

		// if (attentionPromise)
		// {
		// 	attentionPromise.then((attention) =>
		// 	{
		// 		this.setState({ attentionPercent: attention });
		// 	}).catch((err) =>
		// 	{
		// 		logger.debug(`Error fetching attention : ${err}`);
		// 	});
		// }
		logger.debug(this.props.attentionPercent);

		return (
			<Paper className={classes.root}>
				<Typography
					variant={'h3'}
					className={classes.title}
				>
					Student Attention
				</Typography>
				<Box
					position='relative'
					display='inline-flex'
					className={classes.progressWrapper}
				>
					<CircularProgress
						className={classes.progress}
						color={'primary'}
						thickness={6}
						size={'150px'}
						variant='determinate'
						value={this.props.attentionState}
					/>
					<Box
						top={0}
						left={0}
						bottom={0}
						right={0}
						position='absolute'
						display='flex'
						alignItems='center'
						justifyContent='center'
					>
						<Typography
							variant='h5'
							component='div'
							color='textSecondary'
						>{`${Math.round(this.props.attentionState)}%`}
						</Typography>
					</Box>
				</Box>
				<Typography
					variant={'h6'}
					className={classes.text}
				>
					{this.props.attentionState} percent of students are paying attention
				</Typography>
			</Paper>
		);
	}
}

export default withStyles(styles)(AttentionStats);