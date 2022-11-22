import fs = require('fs');
import path = require('path')
import stream = require('stream');
import os = require("os");
import { ILogObject, Logger } from "tslog";

const mkdirsForFile = (filePath: string) => {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
};

interface Ctx {
	logger: Logger | null;
}

const ctx: Ctx = {
	logger: null
};

const initialize = (p: NodeJS.Process, logname: string): Logger => {
	if(ctx.logger != null) {
		ctx.logger.warn("trying initialize again for same process");
		return ctx.logger;
	}

	const logFileName = `${logname}.ansi`;
	const logPath = (() => {
		if(process.platform === "win32") {
			return path.join(os.homedir(), logFileName);
		} else {
			return `/tmp/${logFileName}`;
		}
	})();

	mkdirsForFile(logPath);

	const logToTransport = (logObject: ILogObject) => {
		fs.appendFileSync(logPath, `[${logObject.logLevel.toUpperCase()}] ${logObject.argumentsArray.join(' ')}\n`);
	};

	const logger: Logger = new Logger( { type: 'hidden' } );
	logger.attachTransport({
		silly: logToTransport,
		debug: logToTransport,
		trace: logToTransport,
		info: logToTransport,
		warn: logToTransport,
		error: logToTransport,
		fatal: logToTransport,
		},
		"debug"
	);

	if(fs.existsSync(logPath)) {
		fs.unlink(logPath, (err) => {
			if(err) {
				logger.error(err);
			}	
		});
	}
	
	logger.debug('Initializing logs for process: ', p.argv.join(' '));	

	class LogStream extends stream.Writable {
		writable = true;
		_write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
			logger.error(chunk.toString());
			callback();
		}
	}

	const logStream = new LogStream();
	p.stderr.write = logStream.write.bind(logStream) as any;	
	p.on('uncaughtException', function(err) {
		logger.fatal((err && err.stack) ? err.stack : err);
	});

	ctx.logger = logger;
	return logger;
};

export default initialize;