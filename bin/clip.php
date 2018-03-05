#!/usr/bin/env php
<?php

if ($argc != 11) {
    echo "error: use icon.php <save_width> <save_height> <clip_left> <clip_top> <clip_width> <clip_height> <origin_width> <origin_height> <input_file> <output_path>\n";
    exit(1);
}
$save_width  = $argv[1];
$save_height  = $argv[2];
$clip_left   = $argv[3];
$clip_top    = $argv[4];
$clip_width  = $argv[5];
$clip_height = $argv[6];
$origin_width = $argv[7];
$origin_height = $argv[8];
$input_file  = $argv[9];
$output_path = $argv[10];

$info = @getimagesize($input_file);

if (!$info) {
    echo "error: file $input_file not a image file\n";
    exit(1);
}

switch ($info[2]) {
    case IMAGETYPE_GIF:
        $im = imagecreatefromgif($input_file);
        break;
    case IMAGETYPE_JPEG:
    case IMAGETYPE_JPEG2000:
        $im = imagecreatefromjpeg($input_file);
        break;
    case IMAGETYPE_PNG:
        $im = imagecreatefrompng($input_file);
        break;
    case IMAGETYPE_BMP:
        $im = imagecreatefromwbmp($input_file);
        break;
    default:
        echo "error: file $input_file image type not support\n";
        exit(1);
        break;
}

$width = $info[0];
$height = $info[1];
// fuck iphone照片需要旋转
if ($origin_width && $origin_height && ($info[0] - $info[1]) * ($origin_width - $origin_height) < 0) {
    // 旋转270度
    // $img2 = imagecreatetruecolor($height,$width);
    // for ($x = 0; $x < $width; $x++) {
    //     for($y=0;$y<$height;$y++) {
    //         imagecopy($img2, $im, $height - 1 - $y, $x, $x, $y, 1, 1);
    //     }
    // }
    // $im = $img2;
    $im = @imagerotate($im, 270, 0);
}

// if ($clip_width * $info[1] > $clip_height * $info[0]) {
//     $width = $info[0];
//     $height = ceil($width * $clip_height/$clip_width);
//     $left = 0;
//     $top = floor(($info[1] - $height) / 2);
// }
// else {
//     $height = $info[1];
//     $width = ceil($height * $clip_width/$clip_height);
//     $left = floor(($info[0] - $width) / 2);
//     $top = 0;
// }

$om = imagecreatetruecolor($save_width, $save_height);
$result = imagecopyresampled(
    $om, $im, 
    0, 0, $clip_left, $clip_top,
    $save_width, $save_height, $clip_width, $clip_height
);

if ($result) {
    $type = 'jpg';
    if (substr($output_path, -1) == '/') {
        $input_name = preg_replace(
            '/(.+)(\.(gif|jpg|jpeg|png|bmp))$/i', 
            '$1', 
            basename($input_file)
        );
        $output_path .= $input_name . '.jpg';
    }
    else if (preg_match('/\.(gif|jpg|jpeg|png)$/', strtolower($output_path), $ms)) {
        $type = ($ms[1] == 'jpeg') ? 'jpg' : $ms[1];
    }

    $output_dir = dirname($output_path);
    if(!is_dir($output_dir)){
        mkdir($output_dir, 755, true);
    }

    switch ($type) {
        case 'jpg':
            imagejpeg($om, $output_path, 80);
            break;
        case 'gif':
            imagegif($om, $output_path);
            break;
        default: // default png format
            imagepng($om, $output_path, 0);
            break;
    }

    echo "image resize and output to $output_path with type $type\n";
}
else {
    echo "error: copy image error\n";
    exit(1);
}