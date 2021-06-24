/**
 * Create a function which will call the callback function
 * after the given amount of milliseconds has passed since
 * the last time the callback function was called.
 */
export const idle = (callback, delay) =>
{
	let handle;

	return () =>
	{
		if (handle)
		{
			clearTimeout(handle);
		}

		handle = setTimeout(callback, delay);
	};
};

/**
 * Error produced when a socket request has a timeout.
 */
export class SocketTimeoutError extends Error
{
	constructor(message)
	{
		super(message);

		this.name = 'SocketTimeoutError';

		if (Error.hasOwnProperty('captureStackTrace')) // Just in V8.
			Error.captureStackTrace(this, SocketTimeoutError);
		else
			this.stack = (new Error(message)).stack;
	}
}

export const injectScript = (scriptId, scriptLink) =>
	new Promise((resolve, reject) =>
	{
		const existingscript = document.getElementById(scriptId);

		if (!existingscript)
		{
			const script = document.createElement('script');

			script.setAttribute('async', '');
			script.setAttribute('id', scriptId);
			script.setAttribute('type', 'text/javascript');
			script.addEventListener('load', () =>
			{
				if (resolve)
				{
					resolve();
				}
			});
			script.addEventListener('error', (e) =>
			{
				if (reject)
				{
					reject(e);
				}
			});
			script.src = scriptLink;
			const node = document.getElementsByTagName('script')[0];

			node.parentNode.insertBefore(script, node);
		}
		else if (resolve)
		{
			resolve();
		}
	});
