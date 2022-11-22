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

Napi::Object to_object(Napi::Env env, const wall_e::lex::token& tok) {
	auto result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "name"), Napi::String::New(env, tok.name));
	result.Set(Napi::String::New(env, "text"), Napi::String::New(env, tok.text));	
	result.Set(Napi::String::New(env, "segment"), to_object(env, tok.segment()));
	result.Set(Napi::String::New(env, "undef"), Napi::Boolean::New(env, tok.undefined));
	return result;
}

Napi::Object to_object(Napi::Env env, const km2::markup_string& str) {
	auto result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "str"), Napi::String::New(env, str.str()));
	result.Set(Napi::String::New(env, "format"), Napi::Number::New(env, str.format()));	
	return result;
}

Napi::Object to_object(Napi::Env env, const km2::lsp::semantic_token& tok) {
	auto result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "type"), Napi::Number::New(env, tok.type));
	result.Set(Napi::String::New(env, "modifier"), Napi::Number::New(env, tok.modifier));	
	result.Set(Napi::String::New(env, "segment"), to_object(env, tok.segment));
	return result;
};

Napi::Object to_object(Napi::Env env, const km2::lsp::semantic_tokens_client_capability& capability) {
	auto result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "tokenTypes"), to_array_of_numbers(env, capability.token_types));
	result.Set(Napi::String::New(env, "tokenModifiers"), to_array_of_numbers(env, capability.token_modifiers));	
	return result;
}

template<>
km2::lsp::semantic_tokens_client_capability from_object<km2::lsp::semantic_tokens_client_capability>(Napi::Object obj) {
	km2::lsp::semantic_tokens_client_capability result;
	result.token_types = km2::lsp::parse_semantic_token_types(vec_from_array_of_strings(obj.Get("tokenTypes").As<Napi::Array>()));
	result.token_modifiers = km2::lsp::parse_semantic_token_modifiers(vec_from_array_of_strings(obj.Get("tokenModifiers").As<Napi::Array>()));
	return result;
}

Napi::Object to_object(Napi::Env env, const km2::lsp::semantic_tokens_legend& legend) {
	auto result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "tokenTypes"), to_array_of_strings(env, km2::lsp::stringify_semantic_token_types(legend.token_types)));
	result.Set(Napi::String::New(env, "tokenModifiers"), to_array_of_strings(env, km2::lsp::stringify_semantic_token_modifiers(legend.token_modifiers)));	
	return result;
}



