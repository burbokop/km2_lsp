#ifndef SERVICE_H
#define SERVICE_H


#include <napi.h>
#include <km2/lsp/service.h>
#include <fstream>


class Service : public Napi::ObjectWrap<Service> {
	std::ofstream m_log;
	km2::lsp::service m_native;

	km2::lsp::service parse_param(const Napi::CallbackInfo& info, std::ofstream& log);

	Napi::Value RegisterSemanticTokens(const Napi::CallbackInfo& info);
    Napi::Value ChangeContent(const Napi::CallbackInfo& info);

	Napi::Value Tokens(const Napi::CallbackInfo& info);
	Napi::Value SemanticTokens(const Napi::CallbackInfo& info);

	Napi::Value Hover(const Napi::CallbackInfo& info);
	Napi::Value Complete(const Napi::CallbackInfo& info);
public:
    static Napi::Object RegisterType(Napi::Env env, Napi::Object exports);
    Service(const Napi::CallbackInfo& info);
};


#endif // SERVICE_H
