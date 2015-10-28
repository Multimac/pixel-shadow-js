uniform sampler2D texture;

uniform float ambient;
uniform float exponent;

varying vec2 v_uv;

void main()
{
	float light = texture2D(texture, v_uv).r;
	float dist = texture2D(texture, v_uv).b;

	float attenuation = pow(1.0 - dist, exponent);
	float val = (light + (1.0 - light) * ambient) * attenuation;

	gl_FragColor = vec4(val);
}