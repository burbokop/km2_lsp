#!/bin/bash



install_mime_type_to_path() {
	echo "creating dir $2..."
	mkdir -p $1/packages
	echo "coping $2..."
	cp ./mimetype-text-x-km2.xml $1/packages
	echo "testing copied $2..."
	ls -l $1/packages
	echo "updating $2 database..."
	update-mime-database $1	
}

if [ "$1" = "--qt" ]; then
	install_mime_type_to_path ~/Qt/Tools/QtCreator/share/mime "qt"	
elif [ "$1" = "--qt-cmake" ]; then
	install_mime_type_to_path ~/Qt/Tools/CMake/share/mime "qt-cmake"
elif [ "$1" = "--global" ]; then
	install_mime_type_to_path /usr/share/mime "global"
else
	install_mime_type_to_path ~/.local/share/mime "local"
fi

echo 'testing...'
gio info ./test.km2 | grep "standard::content-type"
