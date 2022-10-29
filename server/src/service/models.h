#ifndef MODELS_H
#define MODELS_H

#include <napi.h>
#include <wall_e/models/error.h>

Napi::Object to_object(Napi::Env env, const wall_e::text_segment& seg);

Napi::Object to_object(Napi::Env env, const wall_e::error& err);

#endif // MODELS_H

