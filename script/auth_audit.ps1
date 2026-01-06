param(
  [string]$BaseUrl = "http://localhost:5065",
  [string]$FrontendOrigin = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"

$results = New-Object System.Collections.Generic.List[Object]
function Add-Result([string]$Name, [bool]$Passed, [string]$Detail) {
  $results.Add([pscustomobject]@{ check = $Name; passed = $Passed; detail = $Detail }) | Out-Null
}

function Invoke-WebRequestSafe {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][string]$Method,
    [hashtable]$Headers,
    [string]$ContentType,
    [string]$Body,
    [Microsoft.PowerShell.Commands.WebRequestSession]$WebSession
  )

  try {
    $args = @{ Uri = $Uri; Method = $Method; UseBasicParsing = $true }
    if ($null -ne $Headers) { $args.Headers = $Headers }
    if (-not [string]::IsNullOrWhiteSpace($ContentType)) { $args.ContentType = $ContentType }
    if (-not [string]::IsNullOrWhiteSpace($Body)) { $args.Body = $Body }
    if ($null -ne $WebSession) { $args.WebSession = $WebSession }
    $r = Invoke-WebRequest @args
    return [pscustomobject]@{ StatusCode = [int]$r.StatusCode; Headers = $r.Headers; Content = $r.Content }
  } catch {
    $resp = $_.Exception.Response
    if ($null -eq $resp) {
      return [pscustomobject]@{ StatusCode = -1; Headers = @{}; Content = $_.Exception.Message }
    }

    $status = [int]$resp.StatusCode
    $headers = @{}
    foreach ($k in $resp.Headers.Keys) { $headers[$k] = $resp.Headers[$k] }

    $content = ""
    try {
      $stream = $resp.GetResponseStream()
      if ($null -ne $stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Dispose()
      }
    } catch {
      $content = ""
    }

    return [pscustomobject]@{ StatusCode = $status; Headers = $headers; Content = $content }
  }
}

function Try-Step([string]$Name, [scriptblock]$Block) {
  try {
    & $Block
  } catch {
    Add-Result $Name $false $_.Exception.Message
  }
}

$originHeaders = @{
  Origin = $FrontendOrigin
  "Access-Control-Request-Method" = "POST"
  "Access-Control-Request-Headers" = "content-type"
}

Try-Step "cors_preflight_auth_login" {
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/auth/login" -Method "OPTIONS" -Headers $originHeaders
  $ao = $r.Headers["Access-Control-Allow-Origin"]
  $ac = $r.Headers["Access-Control-Allow-Credentials"]
  $ok = ($r.StatusCode -eq 204 -and $ao -eq $FrontendOrigin -and $ac -eq "true")
  $extra = if ($r.StatusCode -eq -1) { " err=$($r.Content)" } else { "" }
  Add-Result "cors_preflight_auth_login" $ok "status=$($r.StatusCode) allowOrigin=$ao allowCreds=$ac$extra"
}

Try-Step "cors_preflight_workouts" {
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/workouts" -Method "OPTIONS" -Headers $originHeaders
  $ao = $r.Headers["Access-Control-Allow-Origin"]
  $ac = $r.Headers["Access-Control-Allow-Credentials"]
  $ok = ($r.StatusCode -eq 204 -and $ao -eq $FrontendOrigin -and $ac -eq "true")
  $extra = if ($r.StatusCode -eq -1) { " err=$($r.Content)" } else { "" }
  Add-Result "cors_preflight_workouts" $ok "status=$($r.StatusCode) allowOrigin=$ao allowCreds=$ac$extra"
}

Try-Step "workouts_create_requires_auth" {
  $body = @{ name = "Test"; days = @() } | ConvertTo-Json -Compress
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/workouts" -Method "POST" -ContentType "application/json" -Body $body
  Add-Result "workouts_create_requires_auth" ($r.StatusCode -eq 401) "status=$($r.StatusCode) body=$($r.Content)"
}

$rand = [guid]::NewGuid().ToString("n").Substring(0, 10)
$email = "audit_$rand@example.com"
$pw = "Passw0rd!"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Try-Step "auth_register" {
  $body = @{ email = $email; password = $pw } | ConvertTo-Json -Compress
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/auth/register" -Method "POST" -WebSession $session -ContentType "application/json" -Body $body
  Add-Result "auth_register" ($r.StatusCode -in 200, 201) "status=$($r.StatusCode)"
}

Try-Step "auth_me_after_register" {
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/auth/me" -Method "GET" -WebSession $session
  $ok = ($r.StatusCode -eq 200 -and ($r.Content -like "*${email}*"))
  Add-Result "auth_me_after_register" $ok "status=$($r.StatusCode) body=$($r.Content)"
}

Try-Step "auth_logout" {
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/auth/logout" -Method "POST" -WebSession $session
  Add-Result "auth_logout" ($r.StatusCode -in 200, 204) "status=$($r.StatusCode)"
}

Try-Step "auth_me_after_logout" {
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/auth/me" -Method "GET" -WebSession $session
  Add-Result "auth_me_after_logout" ($r.StatusCode -eq 401) "status=$($r.StatusCode) body=$($r.Content)"
}

Try-Step "auth_login" {
  $body = @{ email = $email; password = $pw } | ConvertTo-Json -Compress
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/auth/login" -Method "POST" -WebSession $session -ContentType "application/json" -Body $body
  Add-Result "auth_login" ($r.StatusCode -eq 200) "status=$($r.StatusCode)"
}

Try-Step "auth_me_after_login" {
  $r = Invoke-WebRequestSafe -Uri "$BaseUrl/api/auth/me" -Method "GET" -WebSession $session
  $ok = ($r.StatusCode -eq 200 -and ($r.Content -like "*${email}*"))
  Add-Result "auth_me_after_login" $ok "status=$($r.StatusCode) body=$($r.Content)"
}

$results | Format-Table -AutoSize

if (($results | Where-Object { -not $_.passed }).Count -gt 0) {
  exit 1
}
