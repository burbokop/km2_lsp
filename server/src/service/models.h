#ifndef MODELS_H
#define MODELS_H

#include <napi.h>
#include <km2/error.h>

Napi::Object to_object(Napi::Env env, const wall_e::text_segment& seg);

Napi::Object to_object(Napi::Env env, const km2::error& err);

#endif // MODELS_H

