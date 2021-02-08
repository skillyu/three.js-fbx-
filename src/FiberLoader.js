/**
 * @author Fiber 
 * @author Alex Zhang
 */
export default function fn(THREE) {
    THREE.FiberLoader = function (manager) {
        this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
    };

    THREE.FiberLoader.prototype = {
        constructor: THREE.FiberLoader,
        load: function (url, onLoad, onProgress, onError) {
            var scope = this;
            var loader = new THREE.FileLoader(scope.manager);
            loader.setResponseType('arraybuffer');
            loader.load(url, function (text) {

                onLoad(scope.parse(url.indexOf('trk') != -1, text));

            }, onProgress, onError);
        },

        parse: function (isTrk, data) {

            function parseVtkFiber(data) {
                // connectivity of the triangles
                var indices = [];

                // triangles vertices
                var positions = [];

                // red, green, blue colors in the range 0 to 1
                var colors = [];

                // normal vector, one per vertex
                var normals = [];

                var result;

                // pattern for reading vertices, 3 floats or integers
                var pat3Floats = /(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)/g;

                // pattern for reading vertices, 4 floats or integers
                var pat4Floats = /(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)/g;

                // pattern for connectivity, an integer followed by any number of ints
                // the first integer is the number of polygon nodes
                var patConnectivity = /^(\d+)\s+([\s\d]*)/;

                // indicates start of vertex data section
                var patPOINTS = /^POINTS /;

                // indicates start of polygon connectivity section
                var patLINES = /^LINES /;

                // indicates start of triangle strips section
                var patTRIANGLE_STRIPS = /^TRIANGLE_STRIPS /;

                // POINT_DATA number_of_values
                var patPOINT_DATA = /^POINT_DATA[ ]+(\d+)/;

                // CELL_DATA number_of_polys
                var patCELL_DATA = /^CELL_DATA[ ]+(\d+)/;

                // Start of color section
                var patCOLOR_SCALARS = /^COLOR_SCALARS /;

                // NORMALS Normals float
                var patNORMALS = /^NORMALS[ ]+(\w+)[ ]+(\w+)/;

                var inPointsSection = false;
                var inLinesSection = false;
                var inTriangleStripSection = false;
                var inPointDataSection = false;
                var inCellDataSection = false;
                var inColorSection = false;
                var inNormalsSection = false;

                var lines = data.split('\n');
                for (var i in lines) {
                    var line = lines[i];

                    if (inPointsSection) {

                        // get the vertices
                        while ((result = pat3Floats.exec(line)) !== null) {

                            var x = parseFloat(result[1]);
                            var y = parseFloat(result[2]);
                            var z = parseFloat(result[3]);
                            positions.push(x, y, z);

                        }

                    } else if (inLinesSection) {

                        if ((result = patConnectivity.exec(line)) !== null) {

                            // numVertices i0 i1 i2 ...
                            var numVertices = parseInt(result[1]);
                            var inds = result[2].split(/\s+/);

                            // split the polygon in numVertices - 2 triangles
                            for (var j = 0; j < numVertices - 1; ++j) {
                                indices.push(parseInt(inds[j]), parseInt(inds[j + 1]));
                            }

                        }

                    } else if (inTriangleStripSection) {

                        if ((result = patConnectivity.exec(line)) !== null) {

                            // numVertices i0 i1 i2 ...
                            var numVertices = parseInt(result[1]);
                            var inds = result[2].split(/\s+/);

                            if (numVertices >= 3) {

                                var i0, i1, i2;
                                // split the polygon in numVertices - 2 triangles
                                for (var j = 0; j < numVertices - 2; j++) {

                                    if (j % 2 === 1) {

                                        i0 = parseInt(inds[j]);
                                        i1 = parseInt(inds[j + 2]);
                                        i2 = parseInt(inds[j + 1]);
                                        indices.push(i0, i1, i2);

                                    } else {

                                        i0 = parseInt(inds[j]);
                                        i1 = parseInt(inds[j + 1]);
                                        i2 = parseInt(inds[j + 2]);
                                        indices.push(i0, i1, i2);

                                    }
                                }
                            }
                        }

                    } else if (inPointDataSection || inCellDataSection) {

                        if (inColorSection) {

                            // Get the colors

                            while ((result = pat4Floats.exec(line)) !== null) {

                                var r = parseFloat(result[1]);
                                var g = parseFloat(result[2]);
                                var b = parseFloat(result[3]);
                                var a = parseFloat(result[4]);
                                colors.push(r, g, b, a);

                            }

                        } else if (inNormalsSection) {

                            // Get the normal vectors

                            while ((result = pat3Floats.exec(line)) !== null) {
                                var nx = parseFloat(result[1]);
                                var ny = parseFloat(result[2]);
                                var nz = parseFloat(result[3]);
                                normals.push(nx, ny, nz);
                            }
                        }
                    }

                    if (patLINES.exec(line) !== null) {

                        inLinesSection = true;
                        inPointsSection = false;
                        inTriangleStripSection = false;

                    } else if (patPOINTS.exec(line) !== null) {

                        inLinesSection = false;
                        inPointsSection = true;
                        inTriangleStripSection = false;

                    } else if (patTRIANGLE_STRIPS.exec(line) !== null) {

                        inLinesSection = false;
                        inPointsSection = false;
                        inTriangleStripSection = true;

                    } else if (patPOINT_DATA.exec(line) !== null) {

                        inPointDataSection = true;
                        inPointsSection = false;
                        inLinesSection = false;
                        inTriangleStripSection = false;

                    } else if (patCELL_DATA.exec(line) !== null) {

                        inCellDataSection = true;
                        inPointsSection = false;
                        inLinesSection = false;
                        inTriangleStripSection = false;

                    } else if (patCOLOR_SCALARS.exec(line) !== null) {
                        inColorSection = true;
                        inNormalsSection = false;
                        inPointsSection = false;
                        inLinesSection = false;
                        inTriangleStripSection = false;

                    } else if (patNORMALS.exec(line) !== null) {

                        inNormalsSection = true;
                        inColorSection = false;
                        inPointsSection = false;
                        inLinesSection = false;
                        inTriangleStripSection = false;
                    }
                }

                var geometry = new THREE.BufferGeometry();
                geometry.setIndex(indices);
                geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                if (colors.length / 4 === positions.length / 3) {
                    geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
                }
                return geometry;
            }

            var _dataPointer = 0;
            function scan(type, chunks) {
                var chunkSize = 1;
                var array_type = Uint8Array;
                switch (type) {
                    // 1 byte data types
                    case 'uchar':
                        break;
                    case 'schar':
                        array_type = Int8Array;
                        break;
                    // 2 byte data types
                    case 'ushort':
                        array_type = Uint16Array;
                        chunkSize = 2;
                        break;
                    case 'sshort':
                        array_type = Int16Array;
                        chunkSize = 2;
                        break;
                    // 4 byte data types
                    case 'uint':
                        array_type = Uint32Array;
                        chunkSize = 4;
                        break;
                    case 'sint':
                        array_type = Int32Array;
                        chunkSize = 4;
                        break;
                    case 'float':
                        array_type = Float32Array;
                        chunkSize = 4;
                        break;
                    // 8 byte data types
                    case 'complex':
                        array_type = Float64Array;
                        chunkSize = 8;
                        break;
                    case 'double':
                        array_type = Float64Array;
                        chunkSize = 8;
                        break;
                }

                // increase the data pointer in-place
                var extractedValue = new array_type(data.slice(_dataPointer, _dataPointer += chunks * chunkSize));

                if (chunks == 1) {
                    // if only one chunk was requested, just return one value
                    return extractedValue[0];
                }

                // return the byte array
                return extractedValue;
            }

            function parseTrkFiber(data) {
                var header = {
                    'id_string': scan('uchar', 6),
                    'dim': scan('ushort', 3),
                    'voxel_size': scan('float', 3),
                    'origin': scan('float', 3),
                    'n_scalars': scan('ushort', 1),
                    'scalar_name': scan('uchar', 200),
                    'n_properties': scan('ushort', 1),
                    'property_name': scan('uchar', 200),
                    'vox_to_ras': scan('float', 16),
                    'reserved': scan('uchar', 444),
                    'voxel_order': scan('uchar', 4),
                    'pad2': scan('uchar', 4),
                    'image_orientation_patient': scan('float', 6),
                    'pad1': scan('uchar', 2),
                    'invert_x': scan('uchar', 1),
                    'invert_y': scan('uchar', 1),
                    'invert_z': scan('uchar', 1),
                    'swap_xy': scan('uchar', 1),
                    'swap_yz': scan('uchar', 1),
                    'swap_zx': scan('uchar', 1),
                    'n_count': scan('uint', 1),
                    'version': scan('uint', 1),
                    'hdr_size': scan('uint', 1)
                };

                // connectivity of the points
                var indices = [];

                // vertices of the points
                var positions = [];

                // red, green, blue colors in the range 0 to 1
                var colors = [];

                //parse trk
                var pointIndex = 0;
                var offset = header.hdr_size;
                while (offset < data.byteLength) {
                    var numPoints = scan('uint', 1);
                    if (typeof (numPoints) === 'undefined') {
                        continue;
                    }

                    var points = scan('float', numPoints * 3);
                    positions.push(-1.0 * points[0], -1.0 * points[1], points[2]);
                    colors.push(0.5, 0.55, 0.5, 1);
                    ++pointIndex;
                    for (var i = 1; i < numPoints - 1; i++) {
                        positions.push(-1.0 * points[3 * i + 0], -1.0 * points[3 * i + 1], points[3 * i + 2]);
                        indices.push(pointIndex - 1, pointIndex);
                        colors.push(0.5, 0.55, 0.5, 1);
                        ++pointIndex;
                    }
                    offset += ((3 + header.n_scalars) * numPoints + header.n_properties + 1) * 4;
                    _dataPointer = offset;
                }

                //geometry
                var geometry = new THREE.BufferGeometry();
                geometry.setIndex(indices);
                geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
                geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
                geometry.computeBoundingSphere();
                return geometry;
            }

            function getStringFile(data) {
                var stringFile = '';
                var charArray = new Uint8Array(data);
                var i = 0;
                var len = charArray.length;
                while (len--) {
                    stringFile += String.fromCharCode(charArray[i++]);
                }
                return stringFile;
            }

            if (isTrk) {
                return parseTrkFiber(data);
            }
            else {
                return parseVtkFiber(getStringFile(data));
            }
        }
    };
    return THREE;
}
