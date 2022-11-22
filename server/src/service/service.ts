import { integer } from 'vscode-languageserver';

import bindings = require('bindings');
const km2lsp_node_service_binding = bindings('km2lsp_node_service');

export interface TextSegment {
	begin: integer;
	end: integer;
}

//export declare type Severity = 0 | 1 | 2 | 3;
export enum Severity {
    Err = 0,
    Warn = 1,
    Info = 2,
    Hint = 3,
}

export interface Token {
	name: string;
	text: string;
	segment: TextSegment;
	undef: boolean;
}

export enum MurkupFormat {
    PlainText = 0,
    Markdown = 1,
}

export interface MurkupString {
	str: string,
	format: MurkupFormat
}

export interface SemanticToken {
	type: number;
	modifier: number;	
	segment: TextSegment;
}

export interface SemanticTokensClientCapability {
	tokenTypes: string[];
	tokenModifiers: string[];
}

export interface SemanticTokensLegend {
	tokenTypes: string[];
	tokenModifiers: string[];
}

export interface CompilationError {
	message: string;
	severity: Severity;
	segment: TextSegment;
}

export class Service {
	native: any;
	constructor(logPath: string) {
		this.native = new km2lsp_node_service_binding.Service(logPath);
	}

	registerSemanticTokens(clientCap: SemanticTokensClientCapability): SemanticTokensLegend {
		return this.native.registerSemanticTokens(clientCap);
	}

	changeContent(uri: string, content: string): CompilationError[] {
		return this.native.changeContent(uri, content);
	}

	tokens(uri: string): Token[] {
		return this.native.tokens(uri);
	}

	semanticTokens(uri: string): SemanticToken[] {
		return this.native.semanticTokens(uri);
	}

	hover(uri: string, offset: integer): MurkupString|undefined {
		return this.native.hover(uri, offset); 
	}

	complete(uri: string, line: integer, character: integer): string[] {
		return this.native.complete(uri, line, character); 
	}
}
