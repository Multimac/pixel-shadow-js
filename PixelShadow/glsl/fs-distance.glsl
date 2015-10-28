uniform sampler2D texture;

varying vec2 v_uv;

void main()
{
    float a = texture2D(texture, v_uv).a;
    float dist = (a > 0.25 ? length(v_uv - 0.5) * 2.0 : 1.0);

    gl_FragColor = vec4(dist, 0.0, 0.0, 0.1);
}