uniform sampler2D texture;

uniform float threshold;

varying vec2 v_uv;

float distance(vec2 uv)
{
    float a = texture2D(texture, uv).a;
    float dist = (a > threshold ? length(uv - 0.5) * 2.0 : 1.0);

    return dist;
}
vec2 distort(vec2 uv)
{
    float u0 = abs(uv.x - 0.5) * 2.0;

    vec2 transUV = vec2(uv.x, (uv.y - 0.5) * 2.0);

    transUV.y *= u0;
    transUV.y = (transUV.y + 1.0) / 2.0;

    return vec2(
        distance(transUV.xy),
        distance(transUV.yx)
    );
}

void main()
{
	gl_FragColor = vec4(distort(v_uv), 0.0, 1.0);
}