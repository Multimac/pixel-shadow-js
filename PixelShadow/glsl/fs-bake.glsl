uniform sampler2D texture;
uniform vec4 color;

varying vec2 v_uv;

void main()
{
	float light = texture2D(texture, v_uv).r;
	gl_FragColor = vec4(color * light);
}