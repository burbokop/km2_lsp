
#include <km2/lsp/service.h>
#include "service.h"
#include "models.h"
#include <wall_e/models/variant.h>

#include <iostream>
#include <filesystem>

std::ostream& log() { 
	static std::ofstream result("/tmp/km2-lsp-default.native.log");
	return result;
}

Napi::Object Service::RegisterType(Napi::Env env, Napi::Object exports) {
	const auto typeName = wall_e::type_name<Service>();

	std::cout << "REGISTERING TYPE: '" << typeName << "'" << std::endl;

    // This method is used to hook the accessor and method callbacks
    Napi::Function func = DefineClass(env, typeName.c_str(), {
        InstanceMethod<&Service::RegisterSemanticTokens>("registerSemanticTokens", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&Service::ChangeContent>("changeContent", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&Service::Tokens>("tokens", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
		InstanceMethod<&Service::SemanticTokens>("semanticTokens", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&Service::Hover>("hover", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
        InstanceMethod<&Service::Complete>("complete", static_cast<napi_property_attributes>(napi_writable | napi_configurable))
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();

    *constructor = Napi::Persistent(func);
    exports.Set(typeName, func);

    env.SetInstanceData<Napi::FunctionReference>(constructor);

    return exports;
}

km2::lsp::service Service::parse_param(const Napi::CallbackInfo& info, std::ofstream& log) {
	Napi::Env env = info.Env();
	const auto logPath = info[0].As<Napi::String>().operator std::string();
	log.open(logPath);
	if(!logPath.empty()) {
		return km2::lsp::service({ km2::Verbose }, log);
	}
	return km2::lsp::service();
}

Service::Service(const Napi::CallbackInfo& info) 
	: Napi::ObjectWrap<Service>(info), 
	  m_native(parse_param(info, m_log)) {}

Napi::Value Service::RegisterSemanticTokens(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	const auto& cap = from_object<km2::lsp::semantic_tokens_client_capability>(info[0].As<Napi::Object>());
	return to_object(env, m_native.register_semantic_tokens(cap));
}

Napi::Value Service::ChangeContent(const Napi::CallbackInfo& info) {
	m_log << "bbb" << std::endl;
	Napi::Env env = info.Env();
	const auto uri = info[0].As<Napi::String>();
	const auto content = info[1].As<Napi::String>();
	return to_array_of_objects(env, m_native.change_content(uri, content));
}

Napi::Value Service::Tokens(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	const auto uri = info[0].As<Napi::String>();
	return to_array_of_objects(env, m_native.tokens(uri));
}

Napi::Value Service::SemanticTokens(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	const auto uri = info[0].As<Napi::String>();
	return to_array_of_objects(env, m_native.semantic_tokens(uri, true));
}

Napi::Value Service::Hover(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	const auto uri = info[0].As<Napi::String>();
	const auto offset = info[1].As<Napi::Number>();

	//const auto predicate = wall_e::text_segment::line_char_predicate(line.operator unsigned int(), character.operator unsigned int());

	if(const auto result = m_native.hover(uri, offset.operator unsigned int())) {
		return to_object(env, result.value());
	} else {
		return env.Undefined();
	}
}

Napi::Value Service::Complete(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	const auto uri = info[0].As<Napi::String>();
	const auto line = info[1].As<Napi::Number>();
	const auto character = info[2].As<Napi::Number>();

	//const auto predicate = wall_e::text_segment::line_char_predicate(line.operator unsigned int(), character.operator unsigned int());

	//const auto nativeResult = m_native.complete(uri, predicate);	

	const wall_e::vec<std::string> nativeResult = {};

	auto result = Napi::Array::New(env);
	std::size_t i = 0;
	for(const auto& item : nativeResult) {
		result.Set(Napi::Number::New(env, i), Napi::String::New(env, item));
		++i;
	}

	return result;
}
