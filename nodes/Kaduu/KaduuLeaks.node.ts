import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

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

		let responseData;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'leak') {
					if (operation === 'browse') {
						const name = this.getNodeParameter('name', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							page?: number;
							size?: number;
							sortDirection?: string;
							sortField?: string;
						};

						const qs: any = {
							page: additionalFields.page || 0,
							size: additionalFields.size || 10,
							sortDirection: additionalFields.sortDirection || 'DESC',
							sortField: additionalFields.sortField || 'createdAt',
						};

						if (name) {
							qs.name = name;
						}

						responseData = await this.helpers.requestWithAuthentication.call(this, 'kaduuOAuth2Api', {
							method: 'GET',
							url: '/leak',
							qs,
							json: true,
						});

					} else if (operation === 'search') {
						const query = this.getNodeParameter('query', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							page?: number;
							size?: number;
							sortDirection?: string;
							sortField?: string;
						};
						const searchOptions = this.getNodeParameter('searchOptions', i) as {
							highlight?: boolean;
							length?: number;
						};

						const qs: any = {
							query,
							page: additionalFields.page || 0,
							size: additionalFields.size || 10,
							sortDirection: additionalFields.sortDirection || 'DESC',
							sortField: additionalFields.sortField || 'createdAt',
							highlight: searchOptions.highlight || false,
							length: searchOptions.length || 1000,
						};

						responseData = await this.helpers.requestWithAuthentication.call(this, 'kaduuOAuth2Api', {
							method: 'GET',
							url: '/leak/search',
							qs,
							json: true,
						});

					} else if (operation === 'get') {
						const leakId = this.getNodeParameter('leakId', i) as string;

						responseData = await this.helpers.requestWithAuthentication.call(this, 'kaduuOAuth2Api', {
							method: 'GET',
							url: `/leak/${leakId}`,
							json: true,
						});
					}
				}

				if (Array.isArray(responseData?.content)) {
					returnData.push.apply(returnData, responseData.content.map(item => ({ json: item })));
				} else {
					returnData.push({ json: responseData });
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}