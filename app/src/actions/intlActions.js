import { UPDATE } from 'react-intl-redux';

export const updateIntl = ({ formats, messages, list }) =>
	({
		type    : UPDATE,
		payload : { formats, messages, list }
	});
