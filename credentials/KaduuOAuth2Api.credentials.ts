import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	IHttpRequestHelper,
	IHttpRequestOptions,
	ICredentialDataDecryptedObject,
} from 'n8n-workflow';

export class KaduuOAuth2Api implements ICredentialType {
	name = 'kaduuOAuth2Api';
	displayName = 'Kaduu OAuth2 API';
	documentationUrl = 'https://app.leak.center/docs';
	extends = ['oAuth2Api'];
	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'password',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Kaduu username',
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
			description: 'Your Kaduu password',
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
				'Accept': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '=https://app.leak.center/svc-saas',
			url: '/stats',
			method: 'GET',
			timeout: 10000,
		},
	};

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject): Promise<any> {
		const username = credentials.username?.toString();
		const password = credentials.password?.toString();

		if (!username || !password) {
			throw new Error('Username and password are required for authentication');
		}

		const formData = new URLSearchParams();
		formData.append('client_id', 'client-api');
		formData.append('client_secret', 'comfy-litigate-embargo-forelimb');
		formData.append('grant_type', 'password');
		formData.append('username', username);
		formData.append('password', password);

		const options: IHttpRequestOptions = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Accept': 'application/json',
			},
			method: 'POST',
			body: formData.toString(),
			url: 'https://app.leak.center/uaa/oauth/token',
			json: true,
			timeout: 10000,
		};

		try {
			const response = await this.helpers.httpRequest(options);

			if (!response.access_token) {
				throw new Error('Failed to obtain access token');
			}

			return {
				oauthTokenData: response,
			};
		} catch (error) {
			throw new Error(`Authentication failed: ${error.message}`);
		}
	}
}
