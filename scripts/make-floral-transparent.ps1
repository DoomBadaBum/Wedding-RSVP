# Removes the baked-in "transparency checkerboard" from the generated floral art
# by flood-filling the neutral background from the image borders and writing real alpha.
param(
    [string]$Source = "public\images\floral-decoration.png",
    [string]$Target = "public\images\floral-decoration.png"
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Source).Path)
$w = $src.Width
$h = $src.Height

$bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($src, 0, 0, $w, $h)
$g.Dispose()
$src.Dispose()

$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

# Background = bright and near-neutral (white and light-grey checker squares).
$isBg = New-Object bool[] ($w * $h)
for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
        $i = $row + $x * 4
        $b = $bytes[$i]; $gr = $bytes[$i + 1]; $r = $bytes[$i + 2]
        $max = [Math]::Max($r, [Math]::Max($gr, $b))
        $min = [Math]::Min($r, [Math]::Min($gr, $b))
        if ($min -ge 200 -and ($max - $min) -le 16) {
            $isBg[$y * $w + $x] = $true
        }
    }
}

# Only clear background connected to the border, so pale flower centres stay opaque.
$clear = New-Object bool[] ($w * $h)
$stack = New-Object 'System.Collections.Generic.Stack[int]'
$edgeRows = @(0, ($h - 1))
$edgeCols = @(0, ($w - 1))
for ($x = 0; $x -lt $w; $x++) {
    foreach ($y in $edgeRows) {
        $p = $y * $w + $x
        if ($isBg[$p] -and -not $clear[$p]) { $clear[$p] = $true; $stack.Push($p) }
    }
}
for ($y = 0; $y -lt $h; $y++) {
    foreach ($x in $edgeCols) {
        $p = $y * $w + $x
        if ($isBg[$p] -and -not $clear[$p]) { $clear[$p] = $true; $stack.Push($p) }
    }
}

while ($stack.Count -gt 0) {
    $p = $stack.Pop()
    $py = [Math]::Floor($p / $w)
    $px = $p - $py * $w
    if ($px -gt 0)      { $n = $p - 1;  if ($isBg[$n] -and -not $clear[$n]) { $clear[$n] = $true; $stack.Push($n) } }
    if ($px -lt $w - 1) { $n = $p + 1;  if ($isBg[$n] -and -not $clear[$n]) { $clear[$n] = $true; $stack.Push($n) } }
    if ($py -gt 0)      { $n = $p - $w; if ($isBg[$n] -and -not $clear[$n]) { $clear[$n] = $true; $stack.Push($n) } }
    if ($py -lt $h - 1) { $n = $p + $w; if ($isBg[$n] -and -not $clear[$n]) { $clear[$n] = $true; $stack.Push($n) } }
}

$cleared = 0
for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
        if ($clear[$y * $w + $x]) {
            $bytes[$row + $x * 4 + 3] = 0
            $cleared++
        }
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$bmp.UnlockBits($data)

$out = Join-Path (Get-Location) $Target
$tmp = "$out.tmp.png"
$bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Move-Item -Force $tmp $out

Write-Output "Cleared $cleared of $($w * $h) pixels"
