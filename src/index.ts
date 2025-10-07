import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// G4 Data Model API Configuration
const G4_API_BASE_URL = "https://h7m.g4educacao.com/v1/data";
const G4_API_TOKEN = "nyz4bex3khk!phr3UHN";

// Define our MCP agent for G4 Data Model
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "G4 Data Model Server",
		version: "1.0.0",
	});

	async init() {
		// Personal Accounts Search Tool
		this.server.tool(
			"search_personal_accounts",
			{
				search_by_names: z.array(z.string()).optional().describe("Array of names to search for (substring search, case-insensitive)"),
				search_by_phones: z.array(z.string()).optional().describe("Array of phone numbers to search for (substring search)"),
				search_by_cpfs: z.array(z.string()).optional().describe("Array of CPF numbers to search for (exact match)"),
				search_by_emails: z.array(z.string()).optional().describe("Array of email addresses to search for (exact match, case-insensitive)"),
				mode: z.enum(["or", "and"]).default("or").describe("Search mode: 'or' returns accounts matching any criteria, 'and' returns accounts matching all criteria"),
				limit: z.number().min(1).max(50).default(50).describe("Maximum number of results to return (1-50)"),
				after: z.number().min(0).default(0).describe("Number of results to skip (for pagination)"),
			},
			async (params: {
				search_by_names?: string[];
				search_by_phones?: string[];
				search_by_cpfs?: string[];
				search_by_emails?: string[];
				mode: "or" | "and";
				limit: number;
				after: number;
			}) => {
				try {
					// Validate that at least one search criteria is provided
					const hasSearchCriteria = params.search_by_names?.length || 
						params.search_by_phones?.length || 
						params.search_by_cpfs?.length || 
						params.search_by_emails?.length;

					if (!hasSearchCriteria) {
						return {
							content: [{
								type: "text",
								text: "Error: At least one search criteria must be provided (names, phones, CPFs, or emails)"
							}]
						};
					}

					// Prepare the request body
					const requestBody: any = {
						mode: params.mode,
						limit: params.limit,
						after: params.after
					};

					if (params.search_by_names?.length) {
						requestBody.search_by_names = params.search_by_names;
					}
					if (params.search_by_phones?.length) {
						requestBody.search_by_phones = params.search_by_phones;
					}
					if (params.search_by_cpfs?.length) {
						requestBody.search_by_cpfs = params.search_by_cpfs;
					}
					if (params.search_by_emails?.length) {
						requestBody.search_by_emails = params.search_by_emails;
					}

					// Make the API request
					const response = await fetch(`${G4_API_BASE_URL}/personal-accounts/search`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${G4_API_TOKEN}`
						},
						body: JSON.stringify(requestBody)
					});

					if (!response.ok) {
						const errorText = await response.text();
						return {
							content: [{
								type: "text",
								text: `API Error (${response.status}): ${errorText}`
							}]
						};
					}

					const results = await response.json() as any[];
					
					if (Array.isArray(results) && results.length === 0) {
						return {
							content: [{
								type: "text",
								text: "No personal accounts found matching the search criteria."
							}]
						};
					}

					return {
						content: [{
							type: "text",
							text: `Found ${results.length} personal account(s):\n\n${JSON.stringify(results, null, 2)}`
						}]
					};

				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `Error searching personal accounts: ${error instanceof Error ? error.message : String(error)}`
						}]
					};
				}
			}
		);

		// Quick phone search tool for convenience
		this.server.tool(
			"search_by_phone",
			{
				phone: z.string().describe("Phone number to search for"),
				limit: z.number().min(1).max(50).default(1).describe("Maximum number of results to return")
			},
			async ({ phone, limit }: { phone: string; limit: number }) => {
				try {
					const response = await fetch(`${G4_API_BASE_URL}/personal-accounts/search`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${G4_API_TOKEN}`
						},
						body: JSON.stringify({
							search_by_phones: [phone],
							mode: "or",
							limit: limit,
							after: 0
						})
					});

					if (!response.ok) {
						const errorText = await response.text();
						return {
							content: [{
								type: "text",
								text: `API Error (${response.status}): ${errorText}`
							}]
						};
					}

					const results = await response.json() as any[];
					
					if (Array.isArray(results) && results.length === 0) {
						return {
							content: [{
								type: "text",
								text: `No personal accounts found for phone number: ${phone}`
							}]
						};
					}

					return {
						content: [{
							type: "text",
							text: `Found ${results.length} account(s) for phone ${phone}:\n\n${JSON.stringify(results, null, 2)}`
						}]
					};

				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `Error searching by phone: ${error instanceof Error ? error.message : String(error)}`
						}]
					};
				}
			}
		);

		// Quick email search tool for convenience
		this.server.tool(
			"search_by_email",
			{
				email: z.string().email().describe("Email address to search for"),
				limit: z.number().min(1).max(50).default(1).describe("Maximum number of results to return")
			},
			async ({ email, limit }: { email: string; limit: number }) => {
				try {
					const response = await fetch(`${G4_API_BASE_URL}/personal-accounts/search`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${G4_API_TOKEN}`
						},
						body: JSON.stringify({
							search_by_emails: [email],
							mode: "or",
							limit: limit,
							after: 0
						})
					});

					if (!response.ok) {
						const errorText = await response.text();
						return {
							content: [{
								type: "text",
								text: `API Error (${response.status}): ${errorText}`
							}]
						};
					}

					const results = await response.json() as any[];
					
					if (Array.isArray(results) && results.length === 0) {
						return {
							content: [{
								type: "text",
								text: `No personal accounts found for email: ${email}`
							}]
						};
					}

					return {
						content: [{
							type: "text",
							text: `Found ${results.length} account(s) for email ${email}:\n\n${JSON.stringify(results, null, 2)}`
						}]
					};

				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `Error searching by email: ${error instanceof Error ? error.message : String(error)}`
						}]
					};
				}
			}
		);
	}
}

export default MyMCP;
