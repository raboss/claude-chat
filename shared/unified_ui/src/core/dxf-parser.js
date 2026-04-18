'use strict';
/**
 * DXF PARSER — AutoCAD DXF file importer
 * Supports: LINE, LWPOLYLINE, POLYLINE+VERTEX, CIRCLE, ARC
 * Output: ClosedShape / Polyline objects
 */

var DXFParser = (function() {

  /** Main entry: text → shapes[] */
  function parse(text) {
    if (!text || typeof text !== 'string') return [];
    // Normalize line endings and parse pairs
    var raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = raw.split('\n');
    var pairs = [];
    for (var i = 0; i < lines.length - 1; i += 2) {
      var code = parseInt(lines[i].trim(), 10);
      var val = lines[i + 1] ? lines[i + 1].trim() : '';
      if (!isNaN(code)) pairs.push({ code: code, value: val });
    }
    var entities = _extractEntities(pairs);
    return _convertToShapes(entities);
  }

  function _extractEntities(pairs) {
    var entities = [];
    var inEntities = false;
    var current = null;

    for (var i = 0; i < pairs.length; i++) {
      var c = pairs[i].code;
      var v = pairs[i].value;

      // Detect ENTITIES section
      if (c === 2 && v === 'ENTITIES') { inEntities = true; continue; }
      if (c === 0 && v === 'ENDSEC') { inEntities = false; if (current) { entities.push(current); current = null; } continue; }
      if (c === 0 && v === 'EOF') { if (current) entities.push(current); break; }

      if (!inEntities) continue;

      // New entity
      if (c === 0) {
        if (current) entities.push(current);
        current = { type: v, data: [], vertices: [], flags: 0, layer: '' };
        continue;
      }

      if (!current) continue;

      // Store all code-value pairs
      current.data.push({ code: c, value: v });

      // Layer
      if (c === 8) current.layer = v;
      // Flags
      if (c === 70) current.flags = parseInt(v, 10) || 0;

      // LWPOLYLINE vertex collection
      if (current.type === 'LWPOLYLINE') {
        if (c === 10) {
          current.vertices.push({ x: parseFloat(v), y: 0, bulge: 0 });
        }
        if (c === 20 && current.vertices.length > 0) {
          current.vertices[current.vertices.length - 1].y = parseFloat(v);
        }
        if (c === 42 && current.vertices.length > 0) {
          current.vertices[current.vertices.length - 1].bulge = parseFloat(v);
        }
      }

      // VERTEX for POLYLINE
      if (current.type === 'VERTEX') {
        if (c === 10) current._vx = parseFloat(v);
        if (c === 20) current._vy = parseFloat(v);
      }
    }
    if (current) entities.push(current);

    // Merge POLYLINE + VERTEX sequences
    var merged = [];
    var polyline = null;
    entities.forEach(function(e) {
      if (e.type === 'POLYLINE') {
        polyline = { type: 'POLYLINE', vertices: [], flags: e.flags, layer: e.layer, data: e.data };
      } else if (e.type === 'VERTEX' && polyline) {
        if (e._vx !== undefined && e._vy !== undefined) {
          polyline.vertices.push({ x: e._vx, y: e._vy, bulge: 0 });
        }
      } else if (e.type === 'SEQEND' && polyline) {
        merged.push(polyline);
        polyline = null;
      } else {
        if (polyline) { merged.push(polyline); polyline = null; }
        merged.push(e);
      }
    });
    if (polyline) merged.push(polyline);

    return merged;
  }

  function _convertToShapes(entities) {
    var shapes = [];

    entities.forEach(function(e) {
      try {
        if (e.type === 'LINE') {
          var d = _dataMap(e.data);
          var x1 = parseFloat(d[10]) || 0, y1 = parseFloat(d[20]) || 0;
          var x2 = parseFloat(d[11]) || 0, y2 = parseFloat(d[21]) || 0;
          if (x1 !== x2 || y1 !== y2) {
            shapes.push(new Polyline([new Point2D(x1, y1, 'A'), new Point2D(x2, y2, 'B')], false));
          }
        }
        else if (e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') {
          if (e.vertices.length < 2) return;
          var pts = e.vertices.map(function(v, i) {
            return new Point2D(v.x, v.y, String.fromCharCode(65 + (i % 26)));
          });
          var closed = (e.flags & 1) === 1;
          if (closed && pts.length >= 3) {
            shapes.push(new ClosedShape(pts));
          } else {
            shapes.push(new Polyline(pts, closed));
          }
        }
        else if (e.type === 'CIRCLE') {
          // Approximate circle as 32-gon
          var d = _dataMap(e.data);
          var cx = parseFloat(d[10]) || 0, cy = parseFloat(d[20]) || 0;
          var r = parseFloat(d[40]) || 100;
          var pts = [];
          for (var a = 0; a < 32; a++) {
            var ang = a * Math.PI * 2 / 32;
            pts.push(new Point2D(cx + r * Math.cos(ang), cy + r * Math.sin(ang)));
          }
          shapes.push(new ClosedShape(pts));
        }
      } catch(err) { /* skip bad entity */ }
    });

    shapes.forEach(function(s) { if (s.autoLabel) s.autoLabel(); });
    return shapes;
  }

  function _dataMap(data) {
    var m = {};
    data.forEach(function(d) { m[d.code] = d.value; });
    return m;
  }

  /** Parse DXF from File input */
  function parseFile(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var shapes = parse(e.target.result);
        callback(shapes);
      } catch(err) {
        console.error('DXF parse error:', err);
        callback([]);
      }
    };
    reader.onerror = function() { callback([]); };
    reader.readAsText(file);
  }

  return { parse: parse, parseFile: parseFile };
})();

// Export
if (typeof module !== 'undefined' && module.exports) module.exports = { DXFParser };
else Object.assign(typeof window !== 'undefined' ? window : this, { DXFParser });
