{
	"targets": [
    	{ 
			"target_name": "km2lsp_node_service",
      		"cflags!": [ "-fno-exceptions" ],
      		"cflags_cc!": [ "-fno-exceptions" ],
      		"cflags": [ "-std=c++20" ],
    		"cflags_cc": [ "-std=c++20", "-frtti" ],
			"sources": [
				"./src/service/index.cpp",
				"./src/service/models.cpp",
				"./src/service/service.cpp"
			],
      		"include_dirs" : [
        		"/usr/local/include/opencv4",
        		"<!@(node -p \"require('node-addon-api').include\")",
				"<!@(echo $INCLUDE)>",
				"<!@(echo %INCLUDE%)>",
				"C:\Program Files\km2ide 0.0.1\include"
      		],
      		"libraries": [
				  #"-lwall_e",
				  #"-lkm2",
				  "C:\Program Files\km2ide 0.0.1\lib\wall_e.lib",
				  "C:\Program Files\km2ide 0.0.1\lib\km2.lib"				  
			],
      		'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    	}
  	]
}
