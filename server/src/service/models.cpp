#include "models.h"

Napi::Object to_object(Napi::Env env, const wall_e::text_segment& seg) {
	auto result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "begin"), Napi::Number::New(env, seg.begin()));
	result.Set(Napi::String::New(env, "end"), Napi::Number::New(env, seg.end()));
	return result;
}

Napi::Object to_object(Napi::Env env, const wall_e::error& err) {
	auto result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "message"), Napi::String::New(env, err.message()));
	result.Set(Napi::String::New(env, "severity"), Napi::Number::New(env, err.sev()));	
	result.Set(Napi::String::New(env, "segment"), to_object(env, err.segment()));
	return result;
}


