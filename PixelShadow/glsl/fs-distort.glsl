uniform sampler2D texture;

varying vec2 v_uv;

void main()
{
	float u0 = abs(v_uv.x - 0.5) * 2.0;

	vec2 transUV = vec2(v_uv.x, (v_uv.y - 0.5) * 2.0);

	transUV.y *= u0;
	transUV.y = (transUV.y + 1.0) / 2.0;

	float hor = texture2D(texture, transUV).r;
	float ver = texture2D(texture, transUV.yx).r;

	gl_FragColor = vec4(hor, ver, 0.0, 1.0);
}