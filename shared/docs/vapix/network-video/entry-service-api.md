# Entry service API

**Source:** https://developer.axis.com/vapix/network-video/entry-service-api/
**Last Updated:** Aug 18, 2025

---

# Entry service API

## Prerequisites​

### Identification​

## API specification​

## Using entry service​

### Get services​

### Get service capabilities​

### Example​

VAPIX® Entry service API is a web services API used to query the Axis product for supported services, service capabilities and their versions.

Supported operations:

VAPIX® Entry service API is supported if:

The API specification is available as an WSDL file at http://www.axis.com/vapix/ws/EntryService.wsdl

The GetServices request returns a list of supported services. For each service, the following information is listed: namespace, port type, XAddr, version and, if requested, the capabilities of the service.

GetServices can be requested with or without capabilities:

A service can have any number of capabilities or no capabilities at all. Capabilities are static and do not change during runtime.

Use GetServiceCapabilities to list the capabilities provided by the entry service.

The example outlined in this section shows how to check if the Axis product supports a certain service.

Start by defining the IP address, user name and password for the Axis product and the namespace of the service to look for. In this example we will check if the product supports the light control service.

Next, use the function CreateEntryServiceClient() to create an entry service client. This function is defined in the sample code and is not part of the API.

Use the entry service client and GetServices to get a list of all services in the Axis product. We use the argument false to list the services without their capabilities.

To check if the Axis product supports the light control service, search the list of services. If the service is found, retrieve the service address and create a service client. The client is created using the function CreateLightServiceClient() which is defined in the same way as CreateEntryServiceClient().

The Xaddr returned by GetServices is an absolute URL. Modify as required to support NAT (Network Address Translation) and similar.

The examples in this document are written using pseudocode.

```
/* Define the address, user name and password for the Axis product. <ip-address> is an IP address or host name.*/string address="<ip-address>";string username="<user name>";string password="<password>";/* Define the namespace of the service to look for.*/string lightTargetNamespace = "http://www.axis.com/vapix/ws/light";
```

```
/* Create an entry service client.*/EntryClient myEntryService = CreateEntryServiceClient(address, username, password);
```

```
/* Get a list of all services.*/Service[] serviceList = myEntryService.GetServices(false);
```

```
/* Get a list of all services.*/Service[] serviceList = myEntryService.GetServices(false);/* Check if light control service is supported. */for (i = 0; i < serviceList.count; i++){  if (serviceList[i].Namespace == lightTargetNamespace)  {    /* Get the service address.*/    string lightXaddr = serviceList[i].Xaddr;    /* Create a light client.*/     LightClient myLightService=CreateLightServiceClient(lightXaddr, username, password);    break;  }}
```

- GetServices — Returns information about the services available in the Axis product. The response is untyped.
- GetServiceCapabilities — Returns the capabilities supported by the entry service.

- Property: Properties.API.WebService.EntryService=yes
- AXIS OS: 5.60 and later

- Use GetServices(false) to list services without their capabilities.
- Use GetServices(true) to list services with their capabilities.

