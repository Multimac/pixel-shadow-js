uniform sampler2D texture;

uniform float ambient;
uniform float exponent;
uniform vec4 color;

varying vec2 v_uv;

float attenuate(vec2 uv)
{
    float light = texture2D(texture, uv).r;
    float dist = texture2D(texture, uv).b;

    float attenuation = pow(1.0 - dist, exponent);
    float val = (light + (1.0 - light) * ambient) * attenuation;

    return val;
}
vec4 bake(vec2 uv)
{
    return color * attenuate(uv);
}

void main()
{
    gl_FragColor = bake(v_uv);
}