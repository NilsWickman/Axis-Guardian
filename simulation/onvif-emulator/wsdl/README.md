# ONVIF WSDL Files

This directory should contain the official ONVIF WSDL files for proper SOAP/XML schema validation.

## Required WSDL Files

Download the official ONVIF WSDL files from: https://www.onvif.org/profiles/specifications/

### Required files:
- `devicemgmt.wsdl` - Device Management Service
- `media.wsdl` - Media Service
- `events.wsdl` - Events Service
- Supporting schema files (onvif.xsd, common.xsd, etc.)

## Installation

```bash
# Download ONVIF 2.x WSDL files
wget https://www.onvif.org/ver10/device/wsdl/devicemgmt.wsdl
wget https://www.onvif.org/ver10/media/wsdl/media.wsdl
wget https://www.onvif.org/ver10/events/wsdl/events.wsdl

# Download schema files
wget https://www.onvif.org/ver10/schema/onvif.xsd
wget https://www.onvif.org/ver10/schema/common.xsd
```

## Alternative: python-onvif-zeep WSDL

The `python-onvif-zeep` library includes WSDL files. You can copy them from the package:

```bash
# Find python-onvif-zeep installation
python -c "import onvif; print(onvif.__file__)"

# WSDL files are typically in: site-packages/wsdl/
# Copy them to this directory
```

## Note

The current implementation uses a simplified SOAP response generation and does not strictly require WSDL files for the emulator to function. However, WSDL files are necessary if you want to:

1. Validate SOAP requests/responses
2. Use zeep library for proper SOAP handling
3. Provide WSDL discovery to ONVIF clients
4. Ensure full ONVIF specification compliance
