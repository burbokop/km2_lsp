/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	HoverParams,
	Hover,
	MarkupContent,
	DocumentHighlightParams,
	DocumentHighlight,
	DocumentColorParams,
	ColorInformation,
	InitializedParams,
	SemanticTokensBuilder,
	integer,
	MarkupKind,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import * as km2 from './service/service';


// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;


import logs from './logs';
import { markAsUntransferable } from 'worker_threads';

const logger = logs(process, 'km2-lsp-server');

logger.info('Start');


import os = require("os");
import path = require('path');

os.homedir();

const km2_service = new km2.Service(path.join(os.homedir(), 'km2-lsp-server-native.ansi'));



enum TokenTypes {
	type = 1,
	class = 2,
	enumMember = 3,
	typeParameter = 4,
	parameter = 5,
	variable = 6,
	function = 7,
	macro = 8,
	keyword = 9,
	comment = 10,
	string = 11,
	number = 12,
	operator = 13,
	_ = 14
}

enum TokenModifiers {
	declaration = 1,
	definition = 2,
	_ = 3
}

/*
function computeLegend(capability: SemanticTokensClientCapabilities): SemanticTokensLegend {
	const clientTokenTypes = new Set<string>(capability.tokenTypes);
	const clientTokenModifiers = new Set<string>(capability.tokenModifiers);
	const tokenTypes: string[] = [];
	for (let i = 0; i < TokenTypes._; i++) {
		const str = TokenTypes[i];
		if (clientTokenTypes.has(str)) {
			tokenTypes.push(str);
		}
	}

	const tokenModifiers: string[] = [];
	for (let i = 0; i < TokenModifiers._; i++) {
		const str = TokenModifiers[i];
		if (clientTokenModifiers.has(str)) {
			tokenModifiers.push(str);
		}
	}

	return { tokenTypes, tokenModifiers };
}*/

let semanticTokensLegend: km2.SemanticTokensLegend; // DEBUG ONLY

connection.onInitialize((params: InitializeParams) => {


	logger.debug('onInitialize', params);
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const mlsupport = params.capabilities.textDocument!.semanticTokens!.multilineTokenSupport;
	const opsupport = params.capabilities.textDocument!.semanticTokens!.overlappingTokenSupport;
	

	logger.debug('client multilineTokenSupport:', mlsupport !== undefined ? mlsupport! : 'not set');
	logger.debug('client overlappingTokenSupport:', opsupport !== undefined ? opsupport! : 'not set');
	
	

	semanticTokensLegend = km2_service.registerSemanticTokens(params.capabilities.textDocument!.semanticTokens!);

	logger.debug('registerSemanticTokens', params.capabilities.textDocument!.semanticTokens!.tokenTypes, "->", semanticTokensLegend.tokenTypes);

	//const semanticTokensLegend = computeLegend(params.capabilities.textDocument!.semanticTokens!);
	const result: InitializeResult = {
		capabilities: {
			documentHighlightProvider: true,
			semanticTokensProvider: {
				full: { delta: true },
				legend: semanticTokensLegend
			},
			colorProvider: true,
			textDocumentSync: TextDocumentSyncKind.Incremental,
			codeActionProvider: true,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}

	result.capabilities.hoverProvider = true;

	logger.debug('onInitialize.result', result);

	return result;
});

connection.onInitialized((params: InitializedParams) => {
	logger.debug('onInitialized', params);
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();
const tokenBuilders: Map<string, SemanticTokensBuilder> = new Map();

function getTokenBuilder(document: TextDocument): SemanticTokensBuilder {
	let result = tokenBuilders.get(document.uri);
	if (result !== undefined) {
		return result;
	}
	result = new SemanticTokensBuilder();
	tokenBuilders.set(document.uri, result);
	return result;
}

function buildTokens(builder: SemanticTokensBuilder, document: TextDocument) {
	for(const token of km2_service.semanticTokens(document.uri)) {
		const begin = document.positionAt(token.segment.begin);
		const end = document.positionAt(token.segment.end);
		const len = token.segment.end - token.segment.begin;


		const textAtSegment = document.getText({ start: document.positionAt(token.segment.begin), end: document.positionAt(token.segment.end) });

		logger.debug('token: ', token.type, textAtSegment, semanticTokensLegend.tokenTypes[token.type]);

		builder.push(begin.line, begin.character, len, token.type, token.modifier);
	}
}

connection.languages.semanticTokens.on(params => {
	const document = documents.get(params.textDocument.uri);
	if (document === undefined) {
		return { data: [] };
	}
	const builder = getTokenBuilder(document);
	buildTokens(builder, document);
	return builder.build();
});

connection.languages.semanticTokens.onDelta((params) => {
	const document = documents.get(params.textDocument.uri);
	if (document === undefined) {
		return { edits: [] };
	}
	const builder = getTokenBuilder(document);
	builder.previousResult(params.previousResultId);
	buildTokens(builder, document);
	return builder.buildEdits();
});

connection.languages.semanticTokens.onRange((params) => {
	return { data: [] };
});




connection.onDocumentColor((p: DocumentColorParams): ColorInformation[] | undefined => {
	logger.debug('onDocumentColor', p);
	return undefined;
});

connection.onHover((params: HoverParams): Hover|undefined => {
	logger.debug("onHover:", params);

	const document = documents.get(params.textDocument.uri);
	const result = km2_service.hover(params.textDocument.uri, document?.offsetAt(params.position) as integer);
	logger.debug("hover result:", result);

	const murkupFormatToKind = (f: km2.MurkupFormat): MarkupKind => {
		switch(f) {
			case km2.MurkupFormat.PlainText: return MarkupKind.PlainText;
			case km2.MurkupFormat.Markdown: return MarkupKind.Markdown;
			default: return MarkupKind.Markdown;
		}
	};

	const murkupStringToContent = (f: km2.MurkupString): MarkupContent => {
		return {
			kind: murkupFormatToKind(f.format),
			value: f.str
		};
	};

	return result !== undefined ? { contents: murkupStringToContent(result) } : undefined;
  });


connection.onDidChangeConfiguration(change => {
	logger.debug('onDidChangeConfiguration', change);
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	documents.all().forEach((document: TextDocument) => 
		validateTextDocument(document, km2_service.changeContent(document.uri, document.getText())));
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	logger.debug('getDocumentSettings', resource);
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

documents.onDidOpen(e => {
	logger.debug('did open:', e, e.document.uri, e.document.getText());

	const errs: km2.CompilationError[] = km2_service.changeContent(e.document.uri, e.document.getText());
	logger.debug('did open content errs:', errs);

	validateTextDocument(e.document, errs);
});

// Only keep settings for open documents
documents.onDidClose(e => {
	logger.debug('onDidClose', e);

	tokenBuilders.delete(e.document.uri);
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	logger.debug('did change content:', change, change.document.uri, change.document.getText());

	const errs: km2.CompilationError[] = km2_service.changeContent(change.document.uri, change.document.getText());
	logger.debug('did change content errs:', errs);

	validateTextDocument(change.document, errs);
});

function km2SeverityToDiagnosticSeverity(s: km2.Severity): DiagnosticSeverity|undefined {
	if(s == km2.Severity.Err) {
		return DiagnosticSeverity.Error;
	} else if(s == km2.Severity.Warn) {
		return DiagnosticSeverity.Warning;
	} else if(s == km2.Severity.Info) {
		return DiagnosticSeverity.Information;
	} else if(s == km2.Severity.Hint) {
		return DiagnosticSeverity.Hint;
	} 
	return undefined;
}

function validateTextDocument(textDocument: TextDocument, errs: km2.CompilationError[]) {
	const diagnostics: Diagnostic[] = errs.map((err: km2.CompilationError): Diagnostic => {
		const diagnostic: Diagnostic = {
			severity: km2SeverityToDiagnosticSeverity(err.severity),
			range: {
				start: textDocument.positionAt(err.segment.begin),
				end: textDocument.positionAt(err.segment.end)
			},
			message: err.message,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		return diagnostic;
	});

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	logger.debug('onDidChangeWatchedFiles', _change);
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		logger.debug('onCompletion', _textDocumentPosition);

		const result = km2_service.complete(
			_textDocumentPosition.textDocument.uri,
			_textDocumentPosition.position.line,
			_textDocumentPosition.position.character
			).map((value: string, index: number) => { return {
				label: value,
				kind: CompletionItemKind.Text,
				data: index
			};});

			logger.debug('\tresult:', result);

		return result;
	});

connection.onDocumentHighlight((highlight: DocumentHighlightParams): DocumentHighlight[] | null => {
	logger.debug('onDocumentHighlight', highlight);



	return [
		//{
		//	range: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } },
		//	kind: DocumentHighlightKind.Read
		//}
	];
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		logger.debug('onCompletionResolve', item);
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
