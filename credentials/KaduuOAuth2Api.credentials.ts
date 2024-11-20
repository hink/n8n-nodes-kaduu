import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KaduuOAuth2Api implements ICredentialType {
	name = 'kaduuOAuth2Api';
	displayName = 'Kaduu OAuth2 API';
	documentationUrl = 'https://app.leak.center/docs';
	extends = ['oAuth2Api'];
	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://app.leak.center/uaa/oauth/token',
			required: true,
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'hidden',
			default: 'client-api',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'hidden',
			default: 'comfy-litigate-embargo-forelimb',
			required: true,
		},
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'hidden',
			default: 'https://app.leak.center/svc-saas',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.oauthTokenData.access_token}}',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '=https://app.leak.center/svc-saas',
			url: '/stats',
			method: 'GET',
		},
	};

	async preAuthentication(this: IHttpRequestHelper) {
		const { username, password } = this.getCredentials('kaduuOAuth2Api') as {
			username: string;
			password: string;
		};

		const options: OptionsWithUri = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			method: 'POST',
			form: {
				client_id: 'client-api',
				client_secret: 'comfy-litigate-embargo-forelimb',
				grant_type: 'password',
				username,
				password,
			},
			uri: 'https://app.leak.center/uaa/oauth/token',
			json: true,
		};

		try {
			const { access_token, expires_in } = await this.helpers.request(options);
			
			return {
				access_token,
				expires_in,
			};
		} catch (error) {
			throw new Error('Kaduu OAuth2 authentication failed');
		}
	}
}