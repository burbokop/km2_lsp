#ifndef SERVICE_H
#define SERVICE_H


#include <napi.h>
#include <km2/lsp/service.h>

class Service : public Napi::ObjectWrap<Service> {
	km2::lsp::service native;

    Napi::Value ChangeContent(const Napi::CallbackInfo& info);
	Napi::Value Hover(const Napi::CallbackInfo& info);
	Napi::Value Complete(const Napi::CallbackInfo& info);
public:
    static Napi::Object RegisterType(Napi::Env env, Napi::Object exports);
    Service(const Napi::CallbackInfo& info);
};


#endif // SERVICE_H
