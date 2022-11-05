import { integer } from 'vscode-languageserver';

const km2lsp_node_service_binding = require('bindings')('km2lsp_node_service');

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
		this.native = new km2lsp_node_service_binding.Service();
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

	hover(uri: string, offset: integer): string|undefined {
		return this.native.hover(uri, offset); 
	}

	complete(uri: string, line: integer, character: integer): string[] {
		return this.native.complete(uri, line, character); 
	}
}

class AA {

}

export const init = () => {
	console.log('aa:', AA);
	console.log('aa:', new AA());
	

	console.log('km2lsp_node_service_binding:', km2lsp_node_service_binding);
	//console.log(`cxx.sayHi() ${km2lsp_node_service_binding.sayHi()}`);
	//console.log('cxx.sayHi()', km2lsp_node_service_binding.sayHi());

	console.log('service.ctor:', km2lsp_node_service_binding.Service);

	const service = new km2lsp_node_service_binding.Service();

	console.log('service', service);
	console.log('GetValue', service.hover);

	console.log('changeContent:', service.changeContent('', ''));
};
