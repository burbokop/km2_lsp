#include <iostream>
#include "models.h"
#include "service.h"

Napi::Object SayHi(const Napi::CallbackInfo& info) {
	std::optional<int> opt;

  	Napi::Env env = info.Env();
  	std::cout << "res" << std::endl;

	auto obj = Napi::Object::New(env);
	obj.Set(Napi::String::New(env, "aaa"), Napi::Function::New(env, SayHi));
  	return obj;
}

Napi::Object init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "sayHi"), Napi::Function::New(env, SayHi));
    //exports.Set(Napi::String::New(env, "new_service"), Napi::Function::New(env, new_service));
    //exports.Set(Napi::String::New(env, "get_service"), Napi::Function::New(env, get_service));
	Service::RegisterType(env, exports);
    return exports;
};

NODE_API_MODULE(hello, init);