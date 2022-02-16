{
	"targets": [
    	{ 
      		"cflags!": [ "-fno-exceptions" ],
      		"cflags_cc!": [ "-fno-exceptions" ],
      		"cflags": [ "-std=c++17" ],
    		"cflags_cc": [ "-std=c++17", "-frtti" ],
			"sources": [
				"./src/service/index.cpp",
				"./src/service/models.cpp",
				"./src/service/service.cpp"
			],
      		"include_dirs" : [
        		"/usr/local/include/opencv4",
        		"<!@(node -p \"require('node-addon-api').include\")"
      		],
      		"libraries": [
				  "-lkm2",
				  "-lwall_e"
			],
      		"target_name": "km2lsp_node_service",
      		'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    	}
  	]
}
