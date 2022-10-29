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
	SemanticTokensDeltaRequest,
	SemanticTokenTypes,
	SemanticTokensRangeParams,
	SemanticTokensRangeRequest,
	SemanticTokensBuilder,
	SemanticTokensClientCapabilities,
	SemanticTokensLegend,
	Range
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

	const semanticTokensLegend = km2_service.registerSemanticTokens(params.capabilities.textDocument!.semanticTokens!);

	logg('registerSemanticTokens', params.capabilities.textDocument!.semanticTokens!, "->", semanticTokensLegend);

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

	logg('onInitialize.result', result);

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
	const toks = km2_service.semanticTokens(document.uri);


	for(const token of toks) {
		const textAtSegment = document.getText({ start: document.positionAt(token.segment.begin), end: document.positionAt(token.segment.end) });
		const textAtPosition = document.getText({ 
			start: { line: token.position.line, character: token.position.character }, 
			end: { line: token.position.line, character: token.position.character + token.position.length } 
		});

		logg('token: ', token, textAtSegment, textAtPosition);

		builder.push(token.position.line, token.position.character, token.position.length, token.type, token.modifier);
	}

	//const text = document.getText();
	//const regexp = /\w+/g;
	//let match: RegExpMatchArray;
	//let tokenCounter = 0;
	//let modifierCounter = 0;
	//while ((match = regexp.exec(text) as RegExpMatchArray) !== null) {
	//	const word = match[0];
	//	const position = document.positionAt(match.index as number);
	//	const tokenType = tokenCounter % TokenTypes._;
	//	const tokenModifier = 1 << modifierCounter % TokenModifiers._;
	//	builder.push(position.line, position.character, word.length, tokenType, tokenModifier);
	//	tokenCounter++;
	//	modifierCounter++;
	//}
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

	tokenBuilders.delete(e.document.uri);
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
