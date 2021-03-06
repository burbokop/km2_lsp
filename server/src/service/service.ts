import { integer } from 'vscode-languageserver';

const native_package = require('../../build/Release/km2lsp_node_service');

export interface TextSegment {
	begin: integer;
	end: integer;
}

export declare type Severity = 0 | 1 | 2 | 3;
export declare namespace Severity {
    const Err: 0;
    const Warn: 1;
    const Info: 2;
    const Hint: 3;
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

	changeContent(uri: string, content: string): CompilationError[] {
		return this.native.changeContent(uri, content);
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
