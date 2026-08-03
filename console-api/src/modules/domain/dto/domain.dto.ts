import { IsIn, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

// Hostname: labels of letters/digits/hyphens separated by dots, with a TLD.
// Deliberately rejects protocols, paths, ports, and wildcards.
const HOSTNAME_RULE =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export class AddDomainDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MaxLength(253)
  @Matches(HOSTNAME_RULE, {
    message: 'Enter a bare hostname like "acme.com" — no http://, path, or port',
  })
  hostname: string;

  @IsIn(['storefront', 'admin'])
  kind: 'storefront' | 'admin';
}
