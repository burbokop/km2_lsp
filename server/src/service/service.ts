import { integer } from 'vscode-languageserver';

const native_package = require('../../build/Release/km2lsp_node_service');

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

export interface TextWidePosition {
    line: number;
    character: number;
    length: number;
}

export interface SemanticToken {
	type: number;
	modifier: number;	
	segment: TextSegment;
	position: TextWidePosition;
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
	constructor() {
		this.native = new native_package.Service();
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

	hover(uri: string, line: integer, character: integer): string|undefined {
		return this.native.hover(uri, line, character); 
	}

	complete(uri: string, line: integer, character: integer): string[] {
		return this.native.complete(uri, line, character); 
	}
}

export const init = () => {
	console.log('cxx', native_package);
	console.log(`cxx.sayHi() ${native_package.sayHi()}`);
	console.log('cxx.sayHi()', native_package.sayHi());

	const service = new native_package.Service();

	console.log('service', service);
	console.log('GetValue', service.hover);

	console.log('changeContent:', service.changeContent('', ''));
};
