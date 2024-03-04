      uniform vec3 eye;\
      varying vec3 position;\
      uniform samplerCube sky;\
      \
      vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {\
        vec3 color;\
        float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);\
        if (q < 1.0e6) {\
          color = getSphereColor(origin + ray * q);\
        } else if (ray.y < 0.0) {\
          vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));\
          color = getWallColor(origin + ray * t.y);\
        } else {\
          vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));\
          vec3 hit = origin + ray * t.y;\
          if (hit.y < 2.0 / 12.0) {\
            color = getWallColor(hit);\
          } else {\
            color = textureCube(sky, ray).rgb;\
            color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);\
          }\
        }\
        if (ray.y < 0.0) color *= waterColor;\
        return color;\
      }\
      \
      void main() {\
        vec2 coord = position.xz * 0.5 + 0.5;\
        vec4 info = texture2D(water, coord);\
        \
        /* make water look more "peaked" */\
        for (int i = 0; i < 5; i++) {\
          coord += info.ba * 0.005;\
          info = texture2D(water, coord);\
        }\
        \
        vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);\
        vec3 incomingRay = normalize(position - eye);\
        \
        ' + (i ? /* underwater */ '\
          normal = -normal;\
          vec3 reflectedRay = reflect(incomingRay, normal);\
          vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);\
          float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));\
          \
          vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, underwaterColor);\
          vec3 refractedColor = getSurfaceRayColor(position, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);\
          \
          gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)), 1.0);\
        ' : /* above water */ '\
          vec3 reflectedRay = reflect(incomingRay, normal);\
          vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);\
          float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));\
          \
          vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, abovewaterColor);\
          vec3 refractedColor = getSurfaceRayColor(position, refractedRay, abovewaterColor);\
          \
          gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);\
        ') + '\
      }\