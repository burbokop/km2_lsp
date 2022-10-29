
#include <km2/lsp/service.h>
#include "service.h"
#include "models.h"
#include <wall_e/models/variant.h>

Napi::Object Service::RegisterType(Napi::Env env, Napi::Object exports) {
	const auto typeName = wall_e::type_name<Service>();

    // This method is used to hook the accessor and method callbacks
    Napi::Function func = DefineClass(env, typeName.c_str(), {
        InstanceMethod<&Service::ChangeContent>("changeContent", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&Service::Hover>("hover", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&Service::Complete>("complete", static_cast<napi_property_attributes>(napi_writable | napi_configurable))
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();

    *constructor = Napi::Persistent(func);
    exports.Set(typeName, func);

    env.SetInstanceData<Napi::FunctionReference>(constructor);

    return exports;
}

Service::Service(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Service>(info) {
  Napi::Env env = info.Env();
  (void)env;
  //Napi::Number value = info[0].As<Napi::Number>();
  //this->_value = value.DoubleValue();
}

Napi::Value Service::ChangeContent(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	const auto uri = info[0].As<Napi::String>();
	const auto content = info[1].As<Napi::String>();

	const auto nativeResult = native.changeContent(uri, content);

	auto result = Napi::Array::New(env);
	std::size_t i = 0;
	for(const auto& item : nativeResult) {
		result.Set(Napi::Number::New(env, i), to_object(env, item));
		++i;
	}

	return result;
}


Napi::Value Service::Hover(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	const auto uri = info[0].As<Napi::String>();
	const auto line = info[1].As<Napi::Number>();
	const auto character = info[2].As<Napi::Number>();

	const auto predicate = wall_e::text_segment::line_char_predicate(line.operator unsigned int(), character.operator unsigned int());

	if(const auto result = native.hover(uri, predicate)) {
		return Napi::String::New(env, result.value());
	} else {
		return env.Undefined();
	}
}

Napi::Value Service::Complete(const Napi::CallbackInfo& info) {
Napi::Env env = info.Env();
	const auto uri = info[0].As<Napi::String>();
	const auto line = info[1].As<Napi::Number>();
	const auto character = info[2].As<Napi::Number>();

	const auto predicate = wall_e::text_segment::line_char_predicate(line.operator unsigned int(), character.operator unsigned int());

	const auto nativeResult = native.complete(uri, predicate);	

	auto result = Napi::Array::New(env);
	std::size_t i = 0;
	for(const auto& item : nativeResult) {
		result.Set(Napi::Number::New(env, i), Napi::String::New(env, item));
		++i;
	}

	return result;
}
