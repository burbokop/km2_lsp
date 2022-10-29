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
	ServerRequestHandler,
	MarkedString,
	Hover,
	MarkupContent,
	DocumentHighlightParams,
	DocumentHighlight,
	DocumentHighlightKind,
	SemanticTokensParams,
	SemanticTokensDeltaParams,
	SemanticTokens,
	SemanticTokensRequest,
	SemanticTokensPartialResult,
	SemanticTokensRegistrationOptions,
	DocumentColorParams,
	ColorInformation,
	InitializedParams,
	SemanticTokensDelta,
	SemanticTokensDeltaPartialResult,
	SemanticTokensDeltaRequest
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// import native addon


import * as km2 from './service/service';

// expose module API
console.log(`km2Service: ${km2}`) ;
console.log("obk:", km2) ;

km2.init();

const km2_service = new km2.Service();


// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

import fs = require('fs');
const logg = (...args: any) => fs.appendFileSync(
	'/tmp/km2-lsp-default.log',
	`${JSON.stringify(args)}\n`
	);


const errLogFile = fs.createWriteStream('/tmp/km2-lsp-default.err.log');
process.stderr.write = errLogFile.write.bind(errLogFile) as any;

logg('Start');
connection.onInitialize((params: InitializeParams) => {



	logg('onInitialize', params);
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

	const result: InitializeResult = {
		capabilities: {
			documentHighlightProvider: true,
			semanticTokensProvider: {
				full: { delta: true },
				legend: {
					tokenTypes: [
						"TOK_GOGADODA",
						"fn"
					],
					tokenModifiers: []
				}
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

	return result;
});

connection.onInitialized((params: InitializedParams) => {
	logg('onInitialized', params);
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

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();



connection.onRequest<
	SemanticTokensParams, 
	SemanticTokens | null, 
	SemanticTokensPartialResult, 
	void, 
	SemanticTokensRegistrationOptions
>(SemanticTokensRequest.type, (p: SemanticTokensParams): SemanticTokens | null => {
	logg('SemanticTokensRequest.type', p);
	return {
		data: [0]
	};
});


connection.onRequest<
	SemanticTokensDeltaParams, 
	SemanticTokens | SemanticTokensDelta | null, 
	SemanticTokensPartialResult | SemanticTokensDeltaPartialResult, 
	void, 
	SemanticTokensRegistrationOptions
>(SemanticTokensDeltaRequest.type, (p: SemanticTokensDeltaParams): SemanticTokens | SemanticTokensDelta | null => {
	logg('SemanticTokensDeltaRequest.type', p);
	return null;
});

connection.onDocumentColor((p: DocumentColorParams): ColorInformation[] | undefined => {
	logg('onDocumentColor', p);
	return undefined;
});

connection.onHover((params: TextDocumentPositionParams): Hover|undefined => {
	const result = km2_service.hover(params.textDocument.uri, params.position.line, params.position.character);
	if(typeof result == 'string') {
		return {
			contents: {
				kind: 'plaintext',
				value: result
			}
		};
	} else {
		return undefined;
	}
  });


connection.onDidChangeConfiguration(change => {
	logg('onDidChangeConfiguration', change);
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
	logg('getDocumentSettings', resource);
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

// Only keep settings for open documents
documents.onDidClose(e => {
	logg('onDidClose', e);
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	logg('did change content', change);

	const errs: km2.CompilationError[] = km2_service.changeContent(change.document.uri, change.document.getText());

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
	// In this simple example we get the settings for every validate run.
	const settings = getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

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

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	logg('onDidChangeWatchedFiles', _change);
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		logg('onCompletion', _textDocumentPosition);

		const result = km2_service.complete(
			_textDocumentPosition.textDocument.uri,
			_textDocumentPosition.position.line,
			_textDocumentPosition.position.character
			).map((value: string, index: number) => { return {
				label: value,
				kind: CompletionItemKind.Text,
				data: index
			};});

		logg('\tresult:', result);

		return result;
	});

connection.onDocumentHighlight((highlight: DocumentHighlightParams): DocumentHighlight[] | null => {
	logg('onDocumentHighlight', highlight);



	return [
		{
			range: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } },
			kind: DocumentHighlightKind.Read
		}
	];
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		logg('onCompletionResolve', item);
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
