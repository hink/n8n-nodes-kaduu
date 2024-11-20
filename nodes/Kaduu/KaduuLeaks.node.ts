import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	NodeApiError,
} from 'n8n-workflow';

interface IAdditionalFields extends IDataObject {
	page?: number;
	size?: number;
	sortDirection?: 'ASC' | 'DESC';
	sortField?: 'createdAt' | 'size' | 'name';
}

interface ISearchOptions extends IDataObject {
	highlight?: boolean;
	length?: number;
}

interface ILeakResponse extends IDataObject {
	content?: any[];
	totalElements?: number;
	totalPages?: number;
	size?: number;
	number?: number;
}

export class KaduuLeaks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kaduu Leaks',
		name: 'kaduuLeaks',
		icon: 'file:kaduu.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Kaduu Leaks API',
		defaults: {
			name: 'Kaduu Leaks',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kaduuOAuth2Api',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://app.leak.center/svc-saas',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			timeout: 10000,
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Leak',
						value: 'leak',
					},
				],
				default: 'leak',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['leak'],
					},
				},
				options: [
					{
						name: 'Browse',
						value: 'browse',
						description: 'Browse all available leaks',
						action: 'Browse leaks',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search through leak content',
						action: 'Search leaks',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a specific leak by ID',
						action: 'Get a leak',
					},
				],
				default: 'browse',
			},
			{
				displayName: 'Name Filter',
				name: 'name',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['leak'],
						operation: ['browse'],
					},
				},
				description: 'Optional name filter for browsing leaks',
			},
			{
				displayName: 'Search Query',
				name: 'query',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['leak'],
						operation: ['search'],
					},
				},
				description: 'Search query (3-10000 characters)',
			},
			{
				displayName: 'Leak ID',
				name: 'leakId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['leak'],
						operation: ['get'],
					},
				},
				description: 'ID of the leak to retrieve',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['leak'],
						operation: ['browse', 'search'],
					},
				},
				options: [
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description: 'Page number of results to return',
					},
					{
						displayName: 'Size',
						name: 'size',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 100,
						},
						default: 10,
						description: 'Number of results per page',
					},
					{
						displayName: 'Sort Direction',
						name: 'sortDirection',
						type: 'options',
						options: [
							{
								name: 'Ascending',
								value: 'ASC',
							},
							{
								name: 'Descending',
								value: 'DESC',
							},
						],
						default: 'DESC',
					},
					{
						displayName: 'Sort Field',
						name: 'sortField',
						type: 'options',
						options: [
							{
								name: 'Created At',
								value: 'createdAt',
							},
							{
								name: 'Size',
								value: 'size',
							},
							{
								name: 'Name',
								value: 'name',
							},
						],
						default: 'createdAt',
					},
				],
			},
			{
				displayName: 'Search Options',
				name: 'searchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['leak'],
						operation: ['search'],
					},
				},
				options: [
					{
						displayName: 'Highlight Results',
						name: 'highlight',
						type: 'boolean',
						default: false,
						description: 'Whether to highlight matching terms in results',
					},
					{
						displayName: 'Fragment Length',
						name: 'length',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1000,
						},
						default: 1000,
						description: 'Length of text fragments to return',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		let responseData: ILeakResponse | undefined;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'leak') {
					if (operation === 'browse') {
						const name = this.getNodeParameter('name', i) as string;
						const additionalFields = this.getNodeParameter(
							'additionalFields',
							i,
						) as IAdditionalFields;

						const qs: IDataObject = {
							...additionalFields,
							name,
						};

						try {
							responseData = await this.helpers.requestWithAuthentication.call(
								this,
								'kaduuOAuth2Api',
								{
									method: 'GET',
									url: '/leak',
									qs,
									json: true,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error);
						}
					} else if (operation === 'search') {
						const query = this.getNodeParameter('query', i) as string;
						const additionalFields = this.getNodeParameter(
							'additionalFields',
							i,
						) as IAdditionalFields;
						const searchOptions = this.getNodeParameter('searchOptions', i) as ISearchOptions;

						if (query.length < 3 || query.length > 10000) {
							throw new NodeOperationError(
								this.getNode(),
								'Search query must be between 3 and 10000 characters long',
								{ itemIndex: i },
							);
						}

						const qs = {
							query,
							page: additionalFields.page ?? 0,
							size: additionalFields.size ?? 10,
							sortDirection: additionalFields.sortDirection ?? 'DESC',
							sortField: additionalFields.sortField ?? 'createdAt',
							highlight: searchOptions.highlight ?? false,
							length: searchOptions.length ?? 1000,
						};

						try {
							responseData = await this.helpers.requestWithAuthentication.call(
								this,
								'kaduuOAuth2Api',
								{
									method: 'GET',
									url: '/leak/search',
									qs,
									json: true,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error);
						}
					} else if (operation === 'get') {
						const leakId = this.getNodeParameter('leakId', i) as string;

						if (!leakId) {
							throw new NodeOperationError(
								this.getNode(),
								'Leak ID is required',
								{ itemIndex: i },
							);
						}

						try {
							responseData = await this.helpers.requestWithAuthentication.call(
								this,
								'kaduuOAuth2Api',
								{
									method: 'GET',
									url: `/leak/${leakId}`,
									json: true,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error);
						}
					}
				}

				if (Array.isArray(responseData?.content)) {
					returnData.push.apply(
						returnData,
						responseData.content.map((item) => ({
							json: {
								...item,
								_metadata: {
									totalElements: responseData?.totalElements,
									totalPages: responseData?.totalPages,
									currentPage: responseData?.number,
									pageSize: responseData?.size,
								},
							},
						})),
					);
				} else if (responseData) {
					returnData.push({ json: responseData as IDataObject });
				} else {
					throw new NodeOperationError(this.getNode(), 'No valid response data received');
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							_error: error.description ?? error.message,
							_node: this.getNode().name,
							_itemIndex: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
