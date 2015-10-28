uniform sampler2D texture;
uniform float pixelSize;

varying vec2 v_uv;

void main()
{
	float lP = ((gl_FragCoord.x - 0.5) * 2.0 + 0.5) * pixelSize;
	float rP = ((gl_FragCoord.x - 0.5) * 2.0 + 1.5) * pixelSize;

	vec2 lC = texture2D(texture, vec2(lP, v_uv.y)).rg;
	vec2 rC = texture2D(texture, vec2(rP, v_uv.y)).rg;

	gl_FragColor = vec4(min(lC, rC), 0.0, 1.0);
}