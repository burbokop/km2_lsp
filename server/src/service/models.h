#ifndef MODELS_H
#define MODELS_H

#include <napi.h>
#include <wall_e/models/error.h>
#include <wall_e/lex.h>
#include <optional>
#include <km2/lsp/service.h>

Napi::Object to_object(Napi::Env env, const wall_e::text_segment& seg);
Napi::Object to_object(Napi::Env env, const wall_e::error& err);
Napi::Object to_object(Napi::Env env, const wall_e::lex::token& tok);

Napi::Object to_object(Napi::Env env, const km2::markup_string& str);

Napi::Object to_object(Napi::Env env, const km2::lsp::semantic_token& tok);
Napi::Object to_object(Napi::Env env, const km2::lsp::semantic_tokens_client_capability& capability);
Napi::Object to_object(Napi::Env env, const km2::lsp::semantic_tokens_legend& legend);

template<typename T>
T from_object(Napi::Object obj) {
	static_assert(std::is_same<T, T>::value, "from_object not implemented for type T");
}

template<>
km2::lsp::semantic_tokens_client_capability from_object<km2::lsp::semantic_tokens_client_capability>(Napi::Object obj);

template<typename T>
inline Napi::Array to_array_of_objects(Napi::Env env, const T& container) {
	auto result = Napi::Array::New(env);
	std::size_t i = 0;
	for(const auto& item : container) {
		result.Set(Napi::Number::New(env, i), to_object(env, item));
		++i;
	}
	return result;
}

template<typename T>
inline Napi::Array to_array_of_numbers(Napi::Env env, const T& container) {
	auto result = Napi::Array::New(env);
	std::size_t i = 0;
	for(const auto& item : container) {
		result.Set(Napi::Number::New(env, i), Napi::Number::New(env, item));
		++i;
	}
	return result;
}

template<typename T>
inline wall_e::vec<T> vec_from_array_of_ints(Napi::Array array) {
	wall_e::vec<T> result;
	result.resize(array.Length());
	for(std::size_t i = 0; i < array.Length(); ++i) {
		result[i] = T(array.Get(i).As<Napi::Number>().operator int());
	}
	return result;
}

template<typename T>
inline Napi::Array to_array_of_strings(Napi::Env env, const T& container) {
	auto result = Napi::Array::New(env);
	std::size_t i = 0;
	for(const auto& item : container) {
		result.Set(Napi::Number::New(env, i), Napi::String::New(env, item));
		++i;
	}
	return result;
}

inline wall_e::vec<std::string> vec_from_array_of_strings(Napi::Array array) {
	wall_e::vec<std::string> result;
	result.resize(array.Length());
	for(std::size_t i = 0; i < array.Length(); ++i) {
		result[i] = array.Get(i).As<Napi::String>();
	}
	return result;
}



#endif // MODELS_H

